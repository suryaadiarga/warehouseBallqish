<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMutation;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class InventoryAnalyticsService
{
    private const SLOW_MOVING_MIN_DAYS = 10;

    private const DEAD_STOCK_MIN_DAYS = 31;

    private const EWMA_ALPHA = 0.30;

    private const CROSTON_ALPHA = 0.20;

    public function buildProductAnalysis(Product $product, ?int $warehouseId = null, int $lookbackDays = 90): array
    {
        $currentStock = $warehouseId
            ? (int) ($product->relationLoaded('productStocks')
                ? $product->productStocks->where('warehouse_id', $warehouseId)->sum('quantity')
                : $product->productStocks()->where('warehouse_id', $warehouseId)->sum('quantity'))
            : (int) $product->stock;

        $rows = $this->dailyOutboundQuery($warehouseId, $lookbackDays)
            ->where('product_id', $product->id)
            ->get();

        return $this->formatProductAnalysis(
            $product,
            $warehouseId,
            $lookbackDays,
            $currentStock,
            $this->dailySeries($rows, $lookbackDays),
            (int) $rows->sum('movement_count'),
            $this->recentMovementCount($rows, 30),
        );
    }

    public function buildMovementAnalysis(?int $warehouseId = null, int $lookbackDays = 90): Collection
    {
        $productsQuery = Product::query()
            ->select(['id', 'category_id', 'sku', 'name', 'stock', 'min_stock_level', 'lead_time_days', 'safety_stock', 'created_at'])
            ->with('category:id,name');

        if ($warehouseId) {
            $productsQuery->withSum(
                ['productStocks as selected_warehouse_stock' => fn (Builder $query) => $query->where('warehouse_id', $warehouseId)],
                'quantity'
            );
        }

        $products = $productsQuery->get();
        $movementRows = $this->dailyOutboundQuery($warehouseId, $lookbackDays)->get()->groupBy('product_id');

        return $products
            ->map(function (Product $product) use ($warehouseId, $lookbackDays, $movementRows) {
                $rows = $movementRows->get($product->id, collect());
                $currentStock = $warehouseId
                    ? (int) ($product->getAttribute('selected_warehouse_stock') ?? 0)
                    : (int) $product->stock;

                return $this->formatProductAnalysis(
                    $product,
                    $warehouseId,
                    $lookbackDays,
                    $currentStock,
                    $this->dailySeries($rows, $lookbackDays),
                    (int) $rows->sum('movement_count'),
                    $this->recentMovementCount($rows, 30),
                );
            })
            ->sortByDesc('critical_score')
            ->sortByDesc('forecast_daily_usage')
            ->values();
    }

    public function buildDashboardInsights(?int $warehouseId = null, int $lookbackDays = 90): array
    {
        $analysis = $this->buildMovementAnalysis($warehouseId, $lookbackDays);

        return [
            'summary' => [
                'safe_products' => $analysis->where('status', 'safe')->count(),
                'warning_products' => $analysis->where('status', 'warning')->count(),
                'critical_products' => $analysis->where('status', 'critical')->count(),
                'slow_moving_products' => $analysis->where('movement_status', 'slow_moving')->count(),
                'dead_stock_products' => $analysis->where('movement_status', 'dead_stock')->count(),
            ],
            'critical_products' => $analysis->where('status', 'critical')->sortByDesc('critical_score')->take(10)->values()->all(),
            'fast_moving_products' => $analysis->filter(fn (array $item) => $item['forecast_daily_usage'] > 0)->sortByDesc('forecast_daily_usage')->take(10)->values()->all(),
            'slow_moving_products' => $analysis->where('movement_status', 'slow_moving')->sortByDesc('days_since_last_outbound')->take(10)->values()->all(),
            'dead_stock_products' => $analysis->where('movement_status', 'dead_stock')->sortByDesc('days_since_last_outbound')->take(10)->values()->all(),
        ];
    }

    private function formatProductAnalysis(
        Product $product,
        ?int $warehouseId,
        int $lookbackDays,
        int $currentStock,
        array $dailySeries,
        int $movementCount,
        int $recentMovementCount,
    ): array {
        $totalOutbound = array_sum($dailySeries);
        $nonZeroDays = count(array_filter($dailySeries, fn (int $quantity) => $quantity > 0));
        $historicalAverage = $totalOutbound / max($lookbackDays, 1);
        $intermittencyRatio = $nonZeroDays / max($lookbackDays, 1);
        $forecastMethod = $intermittencyRatio <= 0.35 ? 'croston_sba' : 'ewma';
        $rawForecast = $forecastMethod === 'croston_sba'
            ? $this->crostonSbaForecast($dailySeries)
            : $this->ewmaForecast($dailySeries);

        $avgDailyUsage = (int) round($historicalAverage);
        $forecastDailyUsage = $rawForecast > 0 ? max(1, (int) round($rawForecast)) : 0;
        $daysSinceLastOutbound = $this->daysSinceLastOutbound($dailySeries, $product);
        $movementStatus = $this->movementStatus($currentStock, $daysSinceLastOutbound);
        $estimatedDaysUntilStockout = $rawForecast > 0 ? (int) ceil($currentStock / $rawForecast) : null;
        $estimatedStockoutDate = $estimatedDaysUntilStockout !== null
            ? now()->addDays($estimatedDaysUntilStockout)->toDateString()
            : null;
        $leadTimeDays = max(1, (int) ($product->lead_time_days ?? 7));
        $safetyStock = max((int) ($product->safety_stock ?? 0), (int) $product->min_stock_level);
        $leadTimeDemand = (int) ceil($rawForecast * $leadTimeDays);
        $demandSpike = $this->hasDemandSpike($dailySeries);
        $criticalScore = $this->criticalScore($currentStock, (int) $product->min_stock_level, $estimatedDaysUntilStockout, $leadTimeDemand, $safetyStock, $demandSpike);
        $status = $criticalScore >= 60 ? 'critical' : ($criticalScore >= 30 ? 'warning' : 'safe');
        $confidence = $this->confidenceScore($movementCount, $lookbackDays, $forecastMethod, $demandSpike);
        $recommendedRestockQty = $this->recommendedRestock($currentStock, (int) $product->min_stock_level, $rawForecast, $leadTimeDays, $safetyStock);

        return [
            'product_id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'category' => $product->category?->name,
            'warehouse_id' => $warehouseId,
            'current_stock' => $currentStock,
            'min_stock_level' => (int) $product->min_stock_level,
            'lead_time_days' => $leadTimeDays,
            'safety_stock' => $safetyStock,
            'avg_daily_usage' => $avgDailyUsage,
            'forecast_daily_usage' => $forecastDailyUsage,
            'forecast_method' => $forecastMethod,
            'confidence_score' => $confidence,
            'critical_score' => $criticalScore,
            'demand_spike' => $demandSpike,
            'days_since_last_outbound' => $daysSinceLastOutbound,
            'movement_status' => $movementStatus,
            'is_slow_moving' => $movementStatus === 'slow_moving',
            'is_dead_stock' => $movementStatus === 'dead_stock',
            'total_outbound_last_30_days' => array_sum(array_slice($dailySeries, -30)),
            'total_outbound_lookback' => $totalOutbound,
            'movement_count_last_30_days' => $recentMovementCount,
            'movement_count_lookback' => $movementCount,
            'estimated_days_until_stockout' => $estimatedDaysUntilStockout,
            'estimated_stockout_date' => $estimatedStockoutDate,
            'status' => $status,
            'risk_reasons' => $this->riskReasons($currentStock, (int) $product->min_stock_level, $estimatedDaysUntilStockout, $leadTimeDemand, $safetyStock, $demandSpike, $movementStatus, $daysSinceLastOutbound),
            'recommendation' => $recommendedRestockQty,
            'recommended_restock_qty' => $recommendedRestockQty,
        ];
    }

    private function dailyOutboundQuery(?int $warehouseId, int $lookbackDays): Builder
    {
        return StockMutation::query()
            ->select('product_id')
            ->selectRaw('DATE(created_at) as movement_date')
            ->selectRaw('SUM(quantity) as total_outbound')
            ->selectRaw('COUNT(*) as movement_count')
            ->where('status', 'approved')
            ->where('type', 'out')
            ->where(fn (Builder $query) => $query->whereNull('mutation_source')->orWhereNotIn('mutation_source', ['transfer', 'adjustment', 'stock_audit']))
            ->when($warehouseId, fn (Builder $query) => $query->where('warehouse_id', $warehouseId))
            ->where('created_at', '>=', now()->subDays($lookbackDays - 1)->startOfDay())
            ->groupBy('product_id', 'movement_date');
    }

    private function dailySeries(Collection $rows, int $lookbackDays): array
    {
        $byDate = $rows->keyBy('movement_date');
        $start = CarbonImmutable::today()->subDays($lookbackDays - 1);
        $series = [];

        for ($day = 0; $day < $lookbackDays; $day++) {
            $series[] = (int) ($byDate->get($start->addDays($day)->toDateString())?->total_outbound ?? 0);
        }

        return $series;
    }

    private function recentMovementCount(Collection $rows, int $days): int
    {
        $cutoff = CarbonImmutable::today()->subDays($days - 1)->toDateString();

        return (int) $rows->filter(fn ($row) => $row->movement_date >= $cutoff)->sum('movement_count');
    }

    private function ewmaForecast(array $series): float
    {
        if ($series === []) {
            return 0;
        }

        $forecast = (float) $series[0];
        foreach (array_slice($series, 1) as $quantity) {
            $forecast = (self::EWMA_ALPHA * $quantity) + ((1 - self::EWMA_ALPHA) * $forecast);
        }

        return max(0, $forecast);
    }

    private function crostonSbaForecast(array $series): float
    {
        $demandEstimate = null;
        $intervalEstimate = null;
        $lastDemandPeriod = null;

        foreach ($series as $period => $quantity) {
            if ($quantity <= 0) {
                continue;
            }

            if ($demandEstimate === null) {
                $demandEstimate = (float) $quantity;
                $intervalEstimate = (float) max(1, $period + 1);
            } else {
                $interval = max(1, $period - $lastDemandPeriod);
                $demandEstimate += self::CROSTON_ALPHA * ($quantity - $demandEstimate);
                $intervalEstimate += self::CROSTON_ALPHA * ($interval - $intervalEstimate);
            }
            $lastDemandPeriod = $period;
        }

        if ($demandEstimate === null || ! $intervalEstimate) {
            return 0;
        }

        return max(0, (1 - (self::CROSTON_ALPHA / 2)) * ($demandEstimate / $intervalEstimate));
    }

    private function hasDemandSpike(array $series): bool
    {
        $recentAverage = array_sum(array_slice($series, -7)) / 7;
        $baseline = array_slice($series, -28, 21);
        $baselineAverage = array_sum($baseline) / max(count($baseline), 1);

        return $recentAverage >= 2 && $baselineAverage > 0 && $recentAverage >= ($baselineAverage * 1.5);
    }

    private function criticalScore(int $stock, int $minimum, ?int $daysUntilStockout, int $leadTimeDemand, int $safetyStock, bool $spike): int
    {
        $score = 0;
        if ($stock <= 0) {
            $score += 50;
        } elseif ($stock <= $minimum / 2) {
            $score += 40;
        } elseif ($stock <= $minimum) {
            $score += 25;
        }

        if ($daysUntilStockout !== null && $daysUntilStockout <= 7) {
            $score += 35;
        } elseif ($daysUntilStockout !== null && $daysUntilStockout <= 14) {
            $score += 20;
        }

        if ($stock < ($leadTimeDemand + $safetyStock)) {
            $score += 25;
        }
        if ($spike) {
            $score += 10;
        }

        return min(100, $score);
    }

    private function confidenceScore(int $movementCount, int $lookbackDays, string $method, bool $spike): int
    {
        $score = min(55, (int) round(($movementCount / max($lookbackDays / 2, 1)) * 55));
        $score += $lookbackDays >= 60 ? 20 : 10;
        $score += $method === 'ewma' ? 20 : 15;
        $score += $spike ? 0 : 5;

        return min(100, max(10, $score));
    }

    private function recommendedRestock(int $stock, int $minimum, float $forecast, int $leadTime, int $safetyStock): int
    {
        $target = max($minimum * 2, (int) ceil($forecast * ($leadTime + 14)) + $safetyStock);

        return max(0, $target - $stock);
    }

    private function daysSinceLastOutbound(array $series, Product $product): int
    {
        for ($index = count($series) - 1; $index >= 0; $index--) {
            if ($series[$index] > 0) {
                return count($series) - 1 - $index;
            }
        }

        return min(
            count($series),
            max(0, (int) CarbonImmutable::today()->diffInDays(CarbonImmutable::parse($product->created_at), true))
        );
    }

    private function movementStatus(int $stock, int $daysSinceLastOutbound): string
    {
        if ($stock <= 0) {
            return 'stock_out';
        }

        if ($daysSinceLastOutbound >= self::DEAD_STOCK_MIN_DAYS) {
            return 'dead_stock';
        }

        if ($daysSinceLastOutbound >= self::SLOW_MOVING_MIN_DAYS) {
            return 'slow_moving';
        }

        return 'active';
    }

    private function riskReasons(int $stock, int $minimum, ?int $days, int $leadTimeDemand, int $safetyStock, bool $spike, string $movementStatus, int $daysSinceLastOutbound): array
    {
        $reasons = [];
        if ($stock <= $minimum) {
            $reasons[] = 'Stok berada di bawah atau sama dengan minimum.';
        }
        if ($days !== null && $days <= 7) {
            $reasons[] = "Diprediksi habis dalam {$days} hari.";
        }
        if ($stock < ($leadTimeDemand + $safetyStock)) {
            $reasons[] = 'Stok tidak mencukupi kebutuhan selama lead time dan safety stock.';
        }
        if ($spike) {
            $reasons[] = 'Terdeteksi lonjakan permintaan dalam 7 hari terakhir.';
        }
        if ($movementStatus === 'dead_stock') {
            $reasons[] = "Tidak ada barang keluar selama {$daysSinceLastOutbound} hari sehingga dikategorikan dead stock.";
        } elseif ($movementStatus === 'slow_moving') {
            $reasons[] = "Tidak ada barang keluar selama {$daysSinceLastOutbound} hari sehingga dikategorikan slow-moving.";
        } elseif ($movementStatus === 'stock_out') {
            $reasons[] = 'Stok produk sudah habis.';
        }
        if ($reasons === []) {
            $reasons[] = 'Stok dan pola permintaan masih dalam batas aman.';
        }

        return $reasons;
    }
}
