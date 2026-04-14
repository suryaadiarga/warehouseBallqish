<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMutation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class InventoryAnalyticsService
{
    public function buildProductAnalysis(Product $product, ?int $warehouseId = null, int $lookbackDays = 30): array
    {
        $currentStock = $warehouseId
            ? (int) $product->productStocks->where('warehouse_id', $warehouseId)->sum('quantity')
            : (int) $product->stock;

        $outboundQuery = $this->approvedOutboundQuery($warehouseId, $lookbackDays)
            ->where('product_id', $product->id);

        $totalOutbound = (int) (clone $outboundQuery)->sum('quantity');
        $movementCount = (int) (clone $outboundQuery)->count();
        $avgDailyUsage = round($totalOutbound / max($lookbackDays, 1), 2);
        $estimatedDaysUntilStockout = $avgDailyUsage > 0
            ? round($currentStock / $avgDailyUsage, 1)
            : null;
        $estimatedStockoutDate = $estimatedDaysUntilStockout !== null
            ? now()->addDays((int) ceil($estimatedDaysUntilStockout))->toDateString()
            : null;

        $status = $this->resolveStatus($currentStock, (int) $product->min_stock_level, $avgDailyUsage, $estimatedDaysUntilStockout);
        $recommendedRestockQty = $this->calculateRecommendedRestock($currentStock, (int) $product->min_stock_level, $avgDailyUsage);

        return [
            'product_id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'category' => $product->category?->name,
            'warehouse_id' => $warehouseId,
            'current_stock' => $currentStock,
            'min_stock_level' => (int) $product->min_stock_level,
            'avg_daily_usage' => $avgDailyUsage,
            'total_outbound_last_30_days' => $totalOutbound,
            'movement_count_last_30_days' => $movementCount,
            'estimated_days_until_stockout' => $estimatedDaysUntilStockout,
            'estimated_stockout_date' => $estimatedStockoutDate,
            'status' => $status,
            'recommendation' => $recommendedRestockQty,
            'recommended_restock_qty' => $recommendedRestockQty,
        ];
    }

    public function buildMovementAnalysis(?int $warehouseId = null, int $lookbackDays = 30): Collection
    {
        $products = Product::query()
            ->select(['id', 'category_id', 'sku', 'name', 'stock', 'min_stock_level'])
            ->with(['category:id,name', 'productStocks'])
            ->get();

        return $products
            ->map(fn (Product $product) => $this->buildProductAnalysis($product, $warehouseId, $lookbackDays))
            ->sortByDesc('avg_daily_usage')
            ->values();
    }

    public function buildDashboardInsights(?int $warehouseId = null, int $lookbackDays = 30): array
    {
        $analysis = $this->buildMovementAnalysis($warehouseId, $lookbackDays);

        return [
            'summary' => [
                'safe_products' => $analysis->where('status', 'safe')->count(),
                'warning_products' => $analysis->where('status', 'warning')->count(),
                'critical_products' => $analysis->where('status', 'critical')->count(),
            ],
            'critical_products' => $analysis
                ->where('status', 'critical')
                ->take(10)
                ->values()
                ->all(),
            'fast_moving_products' => $analysis
                ->filter(fn (array $item) => $item['avg_daily_usage'] > 0)
                ->take(10)
                ->values()
                ->all(),
            'slow_moving_products' => $analysis
                ->filter(fn (array $item) => $item['avg_daily_usage'] > 0)
                ->sortBy('avg_daily_usage')
                ->take(10)
                ->values()
                ->all(),
        ];
    }

    private function approvedOutboundQuery(?int $warehouseId, int $lookbackDays): Builder
    {
        return StockMutation::query()
            ->where('status', 'approved')
            ->where('type', 'out')
            ->when($warehouseId, fn (Builder $query) => $query->where('warehouse_id', $warehouseId))
            ->where('created_at', '>=', now()->subDays($lookbackDays));
    }

    private function resolveStatus(int $currentStock, int $minStockLevel, float $avgDailyUsage, ?float $estimatedDaysUntilStockout): string
    {
        if ($currentStock <= 0) {
            return 'critical';
        }

        if ($currentStock <= $minStockLevel / 2) {
            return 'critical';
        }

        if ($estimatedDaysUntilStockout !== null && $estimatedDaysUntilStockout <= 7) {
            return 'critical';
        }

        if ($currentStock <= $minStockLevel) {
            return 'warning';
        }

        if ($avgDailyUsage > 0 && $estimatedDaysUntilStockout !== null && $estimatedDaysUntilStockout <= 14) {
            return 'warning';
        }

        return 'safe';
    }

    private function calculateRecommendedRestock(int $currentStock, int $minStockLevel, float $avgDailyUsage): int
    {
        $baseTarget = max($minStockLevel * 2, (int) ceil($avgDailyUsage * 14));

        return max($baseTarget - $currentStock, 0);
    }
}
