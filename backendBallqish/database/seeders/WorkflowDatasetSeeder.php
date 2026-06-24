<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockAudit;
use App\Models\StockMutation;
use App\Models\User;
use App\Services\InventoryAnalyticsService;
use App\Services\StockAuditService;
use App\Services\StockMutationService;
use App\Support\UserRoles;
use Illuminate\Database\Seeder;
use RuntimeException;

class WorkflowDatasetSeeder extends Seeder
{
    private const EXPECTED_TOTAL_MUTATIONS = 62980;

    public function run(): void
    {
        $admin = User::query()->where('role', UserRoles::WAREHOUSE_MANAGER)->firstOrFail();
        $staff = User::query()->where('role', UserRoles::WAREHOUSE_STAFF)->firstOrFail();
        $mutationService = app(StockMutationService::class);
        $auditService = app(StockAuditService::class);
        $analyticsService = app(InventoryAnalyticsService::class);

        $positions = ProductStock::query()
            ->with('product:id,category_id')
            ->where('quantity', '>=', 5)
            ->orderByDesc('quantity')
            ->limit(80)
            ->get();

        if ($positions->count() < 30) {
            throw new RuntimeException('Posisi stok tidak cukup untuk membuat contoh workflow.');
        }

        foreach ($positions->take(10) as $index => $position) {
            $mutationService->createDraft([
                'product_id' => $position->product_id,
                'warehouse_id' => $position->warehouse_id,
                'warehouse_location_id' => $position->warehouse_location_id,
                'type' => $index % 2 === 0 ? 'out' : 'in',
                'quantity' => 1 + ($index % 3),
                'note' => 'Menunggu pemeriksaan dokumen',
            ], $staff->id);
        }

        foreach ($positions->slice(10, 10) as $position) {
            $mutationService->createTransfer([
                'product_id' => $position->product_id,
                'from_warehouse_id' => $position->warehouse_id,
                'from_warehouse_location_id' => $position->warehouse_location_id,
                'to_warehouse_id' => $position->warehouse_id,
                'quantity' => 1,
                'note' => 'Penataan ulang lokasi penyimpanan',
            ], $admin->id, $admin->role);
        }

        $analysis = $analyticsService->buildMovementAnalysis()->keyBy('product_id');
        $warningProfile = $analysis->filter(fn (array $item) => $item['product_id'] >= 81 && $item['product_id'] <= 200);
        $calibrationProducts = collect()
            ->push($warningProfile->firstWhere('status', 'critical'))
            ->concat($warningProfile->where('status', 'safe')->take(10))
            ->push($warningProfile->firstWhere('status', 'warning'))
            ->filter()
            ->values();

        if ($calibrationProducts->count() !== 12) {
            throw new RuntimeException('Produk kalibrasi risiko tidak lengkap.');
        }

        $calibrations = $calibrationProducts->map(function (array $item, int $index) use ($analyticsService) {
            $desiredStatus = 'warning';
            $position = ProductStock::query()
                ->where('product_id', $item['product_id'])
                ->orderByDesc('quantity')
                ->firstOrFail();
            $targetTotal = $this->findTargetTotal(
                Product::query()->findOrFail($item['product_id']),
                $position,
                $desiredStatus,
                $analyticsService
            );

            return compact('position', 'targetTotal', 'desiredStatus', 'index');
        });

        foreach ($calibrations->take(6) as $calibration) {
            $position = $calibration['position'];
            $currentTotal = (int) Product::query()->whereKey($position->product_id)->value('stock');
            $difference = $calibration['targetTotal'] - $currentTotal;
            $mutationService->createAdjustment([
                'product_id' => $position->product_id,
                'warehouse_id' => $position->warehouse_id,
                'warehouse_location_id' => $position->warehouse_location_id,
                'type' => $difference > 0 ? 'increase' : 'decrease',
                'quantity' => abs($difference),
                'reason' => $difference > 0 ? 'Barang ditemukan saat penataan rak' : 'Barang rusak saat pemeriksaan',
                'note' => null,
            ], $admin->id, $admin->role);
        }

        foreach ($calibrations->slice(6, 6) as $calibration) {
            $position = $calibration['position']->fresh();
            $audit = $auditService->create([
                'warehouse_id' => $position->warehouse_id,
                'warehouse_location_id' => $position->warehouse_location_id,
                'note' => 'Audit stok berkala',
            ], $staff->id);
            $currentTotal = (int) Product::query()->whereKey($position->product_id)->value('stock');
            $physicalTarget = $position->quantity + ($calibration['targetTotal'] - $currentTotal);
            $counts = $audit->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'physical_qty' => $item->product_id === $position->product_id
                    ? $physicalTarget
                    : $item->system_qty,
            ])->all();

            $auditService->recordCounts($audit->id, $counts);
            $auditService->complete($audit->id, $admin->id);
        }

        if (StockAudit::query()->where('status', 'completed')->count() !== 6) {
            throw new RuntimeException('Contoh riwayat audit stok tidak lengkap.');
        }

        $risk = $analyticsService->buildMovementAnalysis()->countBy('status');
        if (($risk['safe'] ?? 0) !== 442 || ($risk['warning'] ?? 0) !== 66 || ($risk['critical'] ?? 0) !== 124) {
            throw new RuntimeException('Distribusi risiko hasil seed tidak sesuai target.');
        }

        $total = StockMutation::query()->count();
        if ($total !== self::EXPECTED_TOTAL_MUTATIONS) {
            throw new RuntimeException("Jumlah mutasi akhir harus ".self::EXPECTED_TOTAL_MUTATIONS.", ditemukan {$total}.");
        }
    }

    private function findTargetTotal(
        Product $product,
        ProductStock $position,
        string $desiredStatus,
        InventoryAnalyticsService $analyticsService
    ): int {
        $originalTotal = (int) $product->stock;
        $originalPosition = (int) $position->quantity;
        $otherQuantity = $originalTotal - $originalPosition;
        $candidates = range(max(0, $otherQuantity), max($originalTotal + 500, $otherQuantity + 1));
        usort($candidates, fn (int $left, int $right) => abs($left - $originalTotal) <=> abs($right - $originalTotal));

        foreach ($candidates as $targetTotal) {
            if ($targetTotal === $originalTotal) {
                continue;
            }

            $targetPosition = $targetTotal - $otherQuantity;
            if ($targetPosition < 0) {
                continue;
            }

            $product->update(['stock' => $targetTotal]);
            $position->update(['quantity' => $targetPosition]);
            $status = $analyticsService->buildProductAnalysis($product->fresh());
            $product->update(['stock' => $originalTotal]);
            $position->update(['quantity' => $originalPosition]);

            if ($status['status'] === $desiredStatus) {
                return $targetTotal;
            }
        }

        throw new RuntimeException("Tidak ditemukan stok target {$desiredStatus} untuk produk {$product->id}.");
    }
}
