<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMutation;
use App\Models\StockOpname;
use App\Models\WarehouseLocation;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockMutationService
{
    public function createDraft(array $data, int $userId)
    {
        $data['user_id'] = $userId;
        $data['status'] = 'draft';
        $data['mutation_source'] = $data['mutation_source'] ?? 'manual';
        $data['reference_number'] = $data['reference_number'] ?? $this->generateReferenceNumber('MUT');

        return StockMutation::create($data);
    }

    public function approveMutation(int $id, string $userRole, ?int $approvedBy = null)
    {
        $this->assertPrivilegedRole($userRole);

        return DB::transaction(function () use ($id, $approvedBy) {
            $mutation = StockMutation::with(['product', 'warehouse', 'warehouseLocation'])->lockForUpdate()->findOrFail($id);

            if ($mutation->status === 'approved') {
                throw new Exception('Transaksi ini sudah disetujui sebelumnya.', 400);
            }

            $this->applyApprovedMutation($mutation, $approvedBy);

            return $mutation->fresh([
                'product',
                'warehouse',
                'warehouseLocation',
                'user',
                'approver',
                'fromWarehouse',
                'toWarehouse',
            ]);
        });
    }

    public function createTransfer(array $data, int $userId, string $userRole): array
    {
        $this->assertPrivilegedRole($userRole);

        return DB::transaction(function () use ($data, $userId) {
            $transferId = 'TRF-' . Str::upper(Str::random(10));
            $note = $data['note'] ?? null;

            $outMutation = StockMutation::create([
                'product_id' => $data['product_id'],
                'warehouse_id' => $data['from_warehouse_id'],
                'warehouse_location_id' => $data['from_warehouse_location_id'] ?? null,
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'user_id' => $userId,
                'approved_by' => $userId,
                'reference_number' => $this->generateReferenceNumber('TRF-OUT'),
                'mutation_source' => 'transfer',
                'transfer_id' => $transferId,
                'type' => 'out',
                'quantity' => $data['quantity'],
                'status' => 'draft',
                'note' => $note,
                'reason' => 'Transfer stok antar gudang',
            ]);

            $this->applyApprovedMutation($outMutation, $userId);

            $inMutation = StockMutation::create([
                'product_id' => $data['product_id'],
                'warehouse_id' => $data['to_warehouse_id'],
                'warehouse_location_id' => $data['to_warehouse_location_id'] ?? null,
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'user_id' => $userId,
                'approved_by' => $userId,
                'reference_number' => $this->generateReferenceNumber('TRF-IN'),
                'mutation_source' => 'transfer',
                'transfer_id' => $transferId,
                'type' => 'in',
                'quantity' => $data['quantity'],
                'status' => 'draft',
                'note' => $note,
                'reason' => 'Transfer stok antar gudang',
            ]);

            $this->applyApprovedMutation($inMutation, $userId);

            return [
                'transfer_id' => $transferId,
                'mutations' => [
                    $outMutation->fresh(['product', 'warehouse', 'warehouseLocation', 'fromWarehouse', 'toWarehouse']),
                    $inMutation->fresh(['product', 'warehouse', 'warehouseLocation', 'fromWarehouse', 'toWarehouse']),
                ],
            ];
        });
    }

    public function createAdjustment(array $data, int $userId, string $userRole): StockMutation
    {
        $this->assertPrivilegedRole($userRole);

        return DB::transaction(function () use ($data, $userId) {
            $mutation = StockMutation::create([
                'product_id' => $data['product_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'warehouse_location_id' => $data['warehouse_location_id'] ?? null,
                'from_warehouse_id' => $data['type'] === 'decrease' ? ($data['warehouse_id'] ?? null) : null,
                'to_warehouse_id' => $data['type'] === 'increase' ? ($data['warehouse_id'] ?? null) : null,
                'user_id' => $userId,
                'approved_by' => $userId,
                'reference_number' => $this->generateReferenceNumber('ADJ'),
                'mutation_source' => 'adjustment',
                'type' => $data['type'] === 'increase' ? 'in' : 'out',
                'quantity' => $data['quantity'],
                'status' => 'draft',
                'note' => $data['note'] ?? null,
                'reason' => $data['reason'],
            ]);

            $this->applyApprovedMutation($mutation, $userId);

            return $mutation->fresh(['product', 'warehouse', 'warehouseLocation']);
        });
    }

    public function createStockOpname(array $data, int $userId): StockOpname
    {
        return DB::transaction(function () use ($data, $userId) {
            $stockOpname = StockOpname::create([
                'warehouse_id' => $data['warehouse_id'],
                'user_id' => $userId,
                'status' => 'draft',
                'note' => $data['note'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $systemQty = $this->getWarehouseTotalStock($item['product_id'], $data['warehouse_id']);
                $physicalQty = (int) $item['physical_qty'];

                $stockOpname->items()->create([
                    'product_id' => $item['product_id'],
                    'system_qty' => $systemQty,
                    'physical_qty' => $physicalQty,
                    'selisih' => $physicalQty - $systemQty,
                ]);
            }

            return $stockOpname->load(['warehouse:id,name', 'user:id,name', 'items.product:id,name,sku']);
        });
    }

    public function completeStockOpname(int $id, int $approvedBy, string $userRole): StockOpname
    {
        $this->assertPrivilegedRole($userRole);

        return DB::transaction(function () use ($id, $approvedBy) {
            $stockOpname = StockOpname::with(['items.product', 'warehouse'])->lockForUpdate()->findOrFail($id);

            if ($stockOpname->status === 'completed') {
                throw new Exception('Stock opname ini sudah diselesaikan sebelumnya.', 400);
            }

            foreach ($stockOpname->items as $item) {
                if ($item->selisih === 0) {
                    continue;
                }

                $mutation = StockMutation::create([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $stockOpname->warehouse_id,
                    'warehouse_location_id' => null,
                    'from_warehouse_id' => $item->selisih < 0 ? $stockOpname->warehouse_id : null,
                    'to_warehouse_id' => $item->selisih > 0 ? $stockOpname->warehouse_id : null,
                    'user_id' => $stockOpname->user_id,
                    'approved_by' => $approvedBy,
                    'reference_number' => $this->generateReferenceNumber('OPN'),
                    'mutation_source' => 'opname',
                    'type' => $item->selisih > 0 ? 'in' : 'out',
                    'quantity' => abs($item->selisih),
                    'status' => 'draft',
                    'note' => $stockOpname->note,
                    'reason' => 'Penyesuaian hasil stock opname',
                ]);

                $this->applyApprovedMutation($mutation, $approvedBy);
            }

            $stockOpname->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            return $stockOpname->fresh(['warehouse:id,name', 'user:id,name', 'items.product:id,name,sku']);
        });
    }

    private function applyApprovedMutation(StockMutation $mutation, ?int $approvedBy = null): void
    {
        $this->ensureValidWarehouseLocationPair($mutation->warehouse_id, $mutation->warehouse_location_id);

        $product = Product::query()->lockForUpdate()->findOrFail($mutation->product_id);
        $beforeQty = $this->getMutationScopeQuantity(
            $mutation->product_id,
            $mutation->warehouse_id,
            $mutation->warehouse_location_id,
            $product->stock
        );

        if ($mutation->type === 'out' && $beforeQty < $mutation->quantity) {
            $message = $mutation->warehouse_id
                ? 'Stok pada gudang/lokasi yang dipilih tidak mencukupi.'
                : "Stok tidak mencukupi! Sisa stok: {$product->stock}";

            throw new Exception($message, 400);
        }

        $afterQty = $mutation->type === 'in'
            ? $beforeQty + $mutation->quantity
            : $beforeQty - $mutation->quantity;

        $this->applyWarehouseStockMutation($mutation);
        $this->syncProductSummaryStock($product, $mutation->type, $mutation->quantity);

        $mutation->update([
            'status' => 'approved',
            'approved_by' => $approvedBy ?? $mutation->approved_by,
            'before_qty' => $beforeQty,
            'after_qty' => $afterQty,
        ]);
    }

    private function applyWarehouseStockMutation(StockMutation $mutation): void
    {
        if (!$mutation->warehouse_id) {
            return;
        }

        $stock = ProductStock::query()
            ->where('product_id', $mutation->product_id)
            ->where('warehouse_id', $mutation->warehouse_id)
            ->where('warehouse_location_id', $mutation->warehouse_location_id)
            ->lockForUpdate()
            ->first();

        if (!$stock) {
            $stock = ProductStock::create([
                'product_id' => $mutation->product_id,
                'warehouse_id' => $mutation->warehouse_id,
                'warehouse_location_id' => $mutation->warehouse_location_id,
                'quantity' => 0,
                'reserved_quantity' => 0,
            ]);
        }

        if ($mutation->type === 'out' && $stock->quantity < $mutation->quantity) {
            throw new Exception('Stok pada gudang/lokasi yang dipilih tidak mencukupi.', 400);
        }

        $newQuantity = $mutation->type === 'in'
            ? $stock->quantity + $mutation->quantity
            : $stock->quantity - $mutation->quantity;

        $stock->update(['quantity' => $newQuantity]);
    }

    private function syncProductSummaryStock(Product $product, string $type, int $quantity): void
    {
        if ($type === 'in') {
            $product->increment('stock', $quantity);
            return;
        }

        if ($product->stock < $quantity) {
            throw new Exception("Stok tidak mencukupi! Sisa stok: {$product->stock}", 400);
        }

        $product->decrement('stock', $quantity);
    }

    private function getMutationScopeQuantity(int $productId, ?int $warehouseId, ?int $warehouseLocationId, int $fallbackQuantity): int
    {
        if (!$warehouseId) {
            return $fallbackQuantity;
        }

        return (int) ProductStock::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('warehouse_location_id', $warehouseLocationId)
            ->lockForUpdate()
            ->value('quantity') ?? 0;
    }

    private function getWarehouseTotalStock(int $productId, int $warehouseId): int
    {
        return (int) ProductStock::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->sum('quantity');
    }

    private function ensureValidWarehouseLocationPair(?int $warehouseId, ?int $locationId): void
    {
        if (!$locationId) {
            return;
        }

        if (!$warehouseId) {
            throw new Exception('Warehouse harus dipilih jika lokasi gudang digunakan.', 422);
        }

        $valid = WarehouseLocation::query()
            ->whereKey($locationId)
            ->where('warehouse_id', $warehouseId)
            ->exists();

        if (!$valid) {
            throw new Exception('Lokasi gudang tidak sesuai dengan warehouse yang dipilih.', 422);
        }
    }

    private function assertPrivilegedRole(string $userRole): void
    {
        $allowedRoles = ['admin_gudang', 'superadmin', 'super_admin'];

        if (!in_array($userRole, $allowedRoles, true)) {
            throw new Exception('Hanya Admin Gudang atau Super Admin yang memiliki otoritas.', 403);
        }
    }

    private function generateReferenceNumber(string $prefix): string
    {
        return $prefix . '-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
    }
}
