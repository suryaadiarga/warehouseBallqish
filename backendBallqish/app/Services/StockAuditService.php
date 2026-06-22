<?php

namespace App\Services;

use App\Models\ProductStock;
use App\Models\StockAudit;
use App\Models\WarehouseLocation;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockAuditService
{
    public function __construct(private readonly StockMutationService $mutationService) {}

    public function create(array $data, int $userId): StockAudit
    {
        return DB::transaction(function () use ($data, $userId) {
            $location = WarehouseLocation::query()->whereKey($data['warehouse_location_id'])->where('warehouse_id', $data['warehouse_id'])->firstOrFail();
            $stocks = ProductStock::query()->where('warehouse_id', $data['warehouse_id'])->where('warehouse_location_id', $location->id)->get();
            if ($stocks->isEmpty()) {
                throw new Exception('Rak kosong sehingga tidak memiliki item untuk diaudit.', 422);
            }

            $audit = StockAudit::create([
                'audit_number' => 'AUD-'.now()->format('Ymd-His').'-'.Str::upper(Str::random(5)),
                'warehouse_id' => $data['warehouse_id'],
                'warehouse_location_id' => $location->id,
                'user_id' => $userId,
                'status' => 'counting',
                'snapshot_at' => now(),
                'note' => $data['note'] ?? null,
            ]);

            foreach ($stocks as $stock) {
                $audit->items()->create(['product_id' => $stock->product_id, 'system_qty' => $stock->quantity]);
            }

            return $this->load($audit);
        });
    }

    public function recordCounts(int $id, array $counts): StockAudit
    {
        return DB::transaction(function () use ($id, $counts) {
            $audit = StockAudit::with('items')->lockForUpdate()->findOrFail($id);
            if (! in_array($audit->status, ['counting', 'review'], true)) {
                throw new Exception('Audit ini tidak dapat diubah lagi.', 422);
            }

            $items = $audit->items->keyBy('product_id');
            foreach ($counts as $count) {
                $item = $items->get($count['product_id']);
                if (! $item) {
                    throw new Exception('Produk tidak termasuk snapshot Audit Stok.', 422);
                }
                $physical = (int) $count['physical_qty'];
                $item->update(['physical_qty' => $physical, 'difference' => $physical - $item->system_qty, 'counted_at' => now()]);
            }

            $audit->update(['status' => $audit->items()->whereNull('physical_qty')->exists() ? 'counting' : 'review']);

            return $this->load($audit);
        });
    }

    public function complete(int $id, int $userId): StockAudit
    {
        return DB::transaction(function () use ($id, $userId) {
            $audit = StockAudit::with('items')->lockForUpdate()->findOrFail($id);
            if ($audit->status !== 'review') {
                throw new Exception('Semua item harus dihitung sebelum Audit Stok diselesaikan.', 422);
            }

            foreach ($audit->items as $item) {
                $currentQty = (int) ProductStock::query()->where('product_id', $item->product_id)->where('warehouse_id', $audit->warehouse_id)->where('warehouse_location_id', $audit->warehouse_location_id)->lockForUpdate()->value('quantity');
                if ($currentQty !== $item->system_qty) {
                    throw new Exception('Stok berubah setelah snapshot audit. Audit harus dibuat ulang.', 409);
                }
                if ($item->difference === 0) {
                    continue;
                }

                $this->mutationService->createApprovedSystemMutation([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $audit->warehouse_id,
                    'warehouse_location_id' => $audit->warehouse_location_id,
                    'type' => $item->difference > 0 ? 'in' : 'out',
                    'quantity' => abs($item->difference),
                    'reference_number' => $audit->audit_number.'-'.$item->id,
                    'mutation_source' => 'stock_audit',
                    'reason' => 'Rekonsiliasi Audit Stok per rak',
                    'note' => $audit->note,
                ], $userId);
            }

            $audit->update(['status' => 'completed', 'completed_by' => $userId, 'completed_at' => now()]);

            return $this->load($audit);
        });
    }

    private function load(StockAudit $audit): StockAudit
    {
        return $audit->fresh(['warehouse:id,name', 'warehouseLocation:id,warehouse_id,code,name', 'user:id,name', 'completer:id,name', 'items.product:id,name,sku']);
    }
}
