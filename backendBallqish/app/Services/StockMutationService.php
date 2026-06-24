<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMutation;
use App\Models\StockTransfer;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Notifications\StockTransferStatusChanged;
use App\Support\UserRoles;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockMutationService
{
    public function createOperationalMovement(array $data, int $userId, string $userRole): StockMutation
    {
        $this->assertRole($userRole, [
            UserRoles::WAREHOUSE_MANAGER,
            UserRoles::WAREHOUSE_STAFF,
            UserRoles::INVENTORY_CONTROLLER,
        ], 'Hanya Warehouse Manager, Warehouse Staff, atau Inventory Controller yang dapat mencatat keluar masuk barang.');

        return DB::transaction(function () use ($data, $userId) {
            $product = Product::query()->with('supplier:id,name')->lockForUpdate()->findOrFail($data['product_id']);
            $type = $data['type'];
            $warehouseId = (int) ($data['warehouse_id'] ?? $this->selectPrimaryWarehouseId());
            $locationId = $data['warehouse_location_id'] ?? $this->selectAutomaticLocation(
                $product->id,
                $warehouseId,
                $type,
                (int) $data['quantity']
            );

            $isInbound = $type === 'in';
            $destinationType = $data['destination_type'] ?? null;
            $toWarehouseId = $destinationType === 'transit' ? (int) $data['to_warehouse_id'] : null;
            $supplierName = $product->supplier?->name ?? 'supplier';

            $mutation = StockMutation::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'warehouse_location_id' => $locationId,
                'from_warehouse_id' => $isInbound ? null : $warehouseId,
                'to_warehouse_id' => $isInbound ? $warehouseId : $toWarehouseId,
                'user_id' => $userId,
                'approved_by' => $userId,
                'reference_number' => $this->generateReferenceNumber($isInbound ? 'INB' : 'OUT'),
                'mutation_source' => $isInbound ? 'supplier_receipt' : ($destinationType === 'transit' ? 'transit_dispatch' : 'customer_dispatch'),
                'type' => $type,
                'quantity' => (int) $data['quantity'],
                'status' => 'draft',
                'note' => $data['note'] ?? null,
                'reason' => $isInbound
                    ? "Barang masuk dari {$supplierName}"
                    : ($destinationType === 'transit' ? 'Barang keluar ke gudang transit' : 'Barang keluar ke customer'),
            ]);

            $this->applyApprovedMutation($mutation, $userId);

            return $mutation->fresh([
                'product:id,name,sku,image_key,supplier_id',
                'product.supplier:id,name',
                'warehouse:id,name',
                'warehouseLocation:id,warehouse_id,code,name',
                'fromWarehouse:id,name',
                'toWarehouse:id,name',
                'user:id,name',
                'approver:id,name',
            ]);
        });
    }

    public function createApprovedSystemMutation(array $data, int $userId): StockMutation
    {
        $mutation = StockMutation::create([
            'product_id' => $data['product_id'],
            'warehouse_id' => $data['warehouse_id'],
            'warehouse_location_id' => $data['warehouse_location_id'],
            'from_warehouse_id' => $data['type'] === 'out' ? $data['warehouse_id'] : null,
            'to_warehouse_id' => $data['type'] === 'in' ? $data['warehouse_id'] : null,
            'user_id' => $userId,
            'approved_by' => $userId,
            'reference_number' => $data['reference_number'] ?? $this->generateReferenceNumber('AUTO'),
            'mutation_source' => $data['mutation_source'],
            'type' => $data['type'],
            'quantity' => $data['quantity'],
            'status' => 'draft',
            'note' => $data['note'] ?? null,
            'reason' => $data['reason'],
        ]);

        $this->applyApprovedMutation($mutation, $userId);

        return $mutation->fresh(['product:id,name,sku,image_key', 'warehouse:id,name', 'warehouseLocation:id,warehouse_id,code,name']);
    }

    public function createDraft(array $data, int $userId)
    {
        if (($data['warehouse_id'] ?? null) && ! ($data['warehouse_location_id'] ?? null)) {
            $data['warehouse_location_id'] = $this->selectAutomaticLocation(
                $data['product_id'],
                $data['warehouse_id'],
                $data['type'],
                $data['quantity']
            );
        }

        $data['user_id'] = $userId;
        $data['status'] = 'draft';
        $data['mutation_source'] = $data['mutation_source'] ?? 'manual';
        $data['reference_number'] = $data['reference_number'] ?? $this->generateReferenceNumber('MUT');

        return StockMutation::create($data);
    }

    public function approveMutation(int $id, string $userRole, ?int $approvedBy = null)
    {
        $this->assertRole($userRole, UserRoles::MUTATION_APPROVERS, 'Hanya Warehouse Manager atau Inventory Controller yang dapat menyetujui mutasi.');

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

    public function createTransfer(array $data, int $userId, string $userRole): StockTransfer
    {
        $this->assertRole($userRole, UserRoles::TRANSFER_CREATORS, 'Hanya Warehouse Manager atau Warehouse Staff yang dapat membuat transfer.');

        return DB::transaction(function () use ($data, $userId) {
            $fromLocationId = $data['from_warehouse_location_id'] ?? $this->selectAutomaticLocation(
                $data['product_id'], $data['from_warehouse_id'], 'out', $data['quantity']
            );
            $toLocationId = $data['to_warehouse_location_id'] ?? $this->selectAutomaticLocation(
                $data['product_id'], $data['to_warehouse_id'], 'in', $data['quantity'],
                $data['from_warehouse_id'] === $data['to_warehouse_id'] ? $fromLocationId : null
            );

            if ($data['from_warehouse_id'] === $data['to_warehouse_id'] && $fromLocationId === $toLocationId) {
                throw new Exception('Rak asal dan tujuan transfer harus berbeda.', 422);
            }

            $this->ensureTransferSourceStock(
                $data['product_id'],
                $data['from_warehouse_id'],
                $fromLocationId,
                $data['quantity']
            );
            $this->ensureInboundLocationAcceptsProduct(
                Product::findOrFail($data['product_id']),
                $toLocationId,
                $data['quantity']
            );

            $transfer = StockTransfer::create([
                'transfer_number' => $this->generateReferenceNumber('TRF'),
                'product_id' => $data['product_id'],
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'from_warehouse_location_id' => $fromLocationId,
                'to_warehouse_location_id' => $toLocationId,
                'created_by' => $userId,
                'updated_by' => $userId,
                'status' => 'pending',
                'quantity' => $data['quantity'],
                'estimated_arrival_at' => $data['estimated_arrival_at'] ?? null,
                'note' => $data['note'] ?? null,
            ]);

            $transfer->histories()->create([
                'user_id' => $userId,
                'from_status' => null,
                'to_status' => 'pending',
                'note' => $data['note'] ?? null,
                'created_at' => now(),
            ]);

            $this->notifyTransfer($transfer, 'Transfer baru menunggu persetujuan');

            return $this->loadTransfer($transfer);
        });
    }

    public function listTransfers(?string $status = null)
    {
        return StockTransfer::query()
            ->with($this->transferRelations())
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->get();
    }

    public function loadTransfer(StockTransfer $transfer): StockTransfer
    {
        return $transfer->load($this->transferRelations());
    }

    public function updateTransferStatus(
        StockTransfer $transfer,
        string $nextStatus,
        array $data,
        int $userId,
        string $userRole
    ): StockTransfer {
        return DB::transaction(function () use ($transfer, $nextStatus, $data, $userId, $userRole) {
            $transfer = StockTransfer::query()->lockForUpdate()->findOrFail($transfer->id);
            $fromStatus = $transfer->status;
            $allowed = [
                'pending' => ['approved', 'rejected', 'cancelled'],
                'approved' => ['in_transit', 'cancelled'],
                'in_transit' => ['arrived', 'discrepancy'],
                'arrived' => ['completed', 'discrepancy'],
                'discrepancy' => ['completed'],
            ];

            if (! in_array($nextStatus, $allowed[$fromStatus] ?? [], true)) {
                throw new Exception("Status {$fromStatus} tidak dapat diubah menjadi {$nextStatus}.", 422);
            }

            $this->assertTransferStatusRole($userRole, $nextStatus);

            $updates = [
                'status' => $nextStatus,
                'updated_by' => $userId,
            ];

            if ($nextStatus === 'approved') {
                $this->ensureTransferSourceStock(
                    $transfer->product_id,
                    $transfer->from_warehouse_id,
                    $transfer->from_warehouse_location_id,
                    $transfer->quantity
                );
                $updates['approved_at'] = now();
            }

            if ($nextStatus === 'in_transit') {
                $outMutation = $this->createTransferMutation($transfer, 'out', $transfer->quantity, $userId);
                $updates['out_mutation_id'] = $outMutation->id;
                $updates['departed_at'] = now();
            }

            if (in_array($nextStatus, ['arrived', 'discrepancy'], true)) {
                $updates['arrived_at'] = now();
            }

            if ($nextStatus === 'discrepancy') {
                $updates['received_quantity'] = (int) $data['received_quantity'];
                $updates['discrepancy_note'] = $data['note'];
            }

            if ($nextStatus === 'completed') {
                $receivedQuantity = array_key_exists('received_quantity', $data)
                    ? (int) $data['received_quantity']
                    : ($transfer->received_quantity ?? $transfer->quantity);

                if ($receivedQuantity < 0) {
                    throw new Exception('Jumlah diterima tidak boleh negatif.', 422);
                }

                if ($receivedQuantity > 0) {
                    $this->ensureInboundLocationAcceptsProduct(
                        Product::findOrFail($transfer->product_id),
                        $transfer->to_warehouse_location_id,
                        $receivedQuantity
                    );
                    $inMutation = $this->createTransferMutation($transfer, 'in', $receivedQuantity, $userId);
                    $updates['in_mutation_id'] = $inMutation->id;
                }
                $updates['received_quantity'] = $receivedQuantity;
                $updates['completed_at'] = now();
            }

            $transfer->update($updates);
            $transfer->histories()->create([
                'user_id' => $userId,
                'from_status' => $fromStatus,
                'to_status' => $nextStatus,
                'note' => $data['note'] ?? null,
                'created_at' => now(),
            ]);

            $this->notifyTransfer($transfer->fresh(), $this->transferStatusTitle($nextStatus));

            return $this->loadTransfer($transfer->fresh());
        });
    }

    private function createTransferMutation(StockTransfer $transfer, string $type, int $quantity, int $userId): StockMutation
    {
        $isOutbound = $type === 'out';
        $mutation = StockMutation::create([
            'product_id' => $transfer->product_id,
            'warehouse_id' => $isOutbound ? $transfer->from_warehouse_id : $transfer->to_warehouse_id,
            'warehouse_location_id' => $isOutbound ? $transfer->from_warehouse_location_id : $transfer->to_warehouse_location_id,
            'from_warehouse_id' => $transfer->from_warehouse_id,
            'to_warehouse_id' => $transfer->to_warehouse_id,
            'user_id' => $userId,
            'approved_by' => $userId,
            'reference_number' => $this->generateReferenceNumber($isOutbound ? 'TRF-OUT' : 'TRF-IN'),
            'mutation_source' => 'transfer',
            'transfer_id' => $transfer->transfer_number,
            'type' => $type,
            'quantity' => $quantity,
            'status' => 'draft',
            'note' => $transfer->note,
            'reason' => 'Transfer stok antar gudang',
        ]);
        $this->applyApprovedMutation($mutation, $userId);

        return $mutation;
    }

    private function ensureTransferSourceStock(int $productId, int $warehouseId, int $locationId, int $quantity): void
    {
        $available = (int) ProductStock::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('warehouse_location_id', $locationId)
            ->value('quantity');

        if ($available < $quantity) {
            throw new Exception('Stok pada rak asal tidak mencukupi.', 422);
        }
    }

    private function transferRelations(): array
    {
        return [
            'product:id,name,sku,image_key',
            'fromWarehouse:id,name',
            'toWarehouse:id,name',
            'fromLocation:id,warehouse_id,code,name',
            'toLocation:id,warehouse_id,code,name',
            'creator:id,name',
            'updater:id,name',
            'histories' => fn ($query) => $query->with('user:id,name')->orderBy('created_at'),
        ];
    }

    private function notifyTransfer(StockTransfer $transfer, string $title): void
    {
        $transfer->loadMissing(['product:id,name', 'fromWarehouse:id,name', 'toWarehouse:id,name', 'creator:id,name,role']);
        $message = "{$transfer->transfer_number}: {$transfer->product->name} dari {$transfer->fromWarehouse->name} ke {$transfer->toWarehouse->name}.";

        $recipientQuery = User::query();
        match ($transfer->status) {
            'pending' => $recipientQuery->where('role', UserRoles::WAREHOUSE_MANAGER),
            'approved', 'rejected' => $recipientQuery->whereKey($transfer->created_by),
            'in_transit', 'arrived' => $recipientQuery->whereIn('role', [
                UserRoles::WAREHOUSE_MANAGER,
                UserRoles::INVENTORY_CONTROLLER,
            ]),
            'discrepancy' => $recipientQuery->where(function ($query) use ($transfer) {
                $query
                    ->whereKey($transfer->created_by)
                    ->orWhereIn('role', [
                        UserRoles::WAREHOUSE_MANAGER,
                        UserRoles::INVENTORY_CONTROLLER,
                    ]);
            }),
            'completed', 'cancelled' => $recipientQuery->where(function ($query) use ($transfer) {
                $query
                    ->whereKey($transfer->created_by)
                    ->orWhere('role', UserRoles::WAREHOUSE_MANAGER);
            }),
            default => $recipientQuery->where('role', UserRoles::WAREHOUSE_MANAGER),
        };

        $recipientQuery
            ->get()
            ->unique('id')
            ->tap(function ($recipients) use ($transfer, $title, $message) {
                $recipients->each->notify(new StockTransferStatusChanged($transfer, $title, $message));

                app(PushNotificationService::class)->sendToUsers($recipients, $title, $message, [
                    'type' => 'stock_transfer',
                    'transfer_id' => $transfer->id,
                    'transfer_number' => $transfer->transfer_number,
                    'status' => $transfer->status,
                ]);
            });
    }

    private function transferStatusTitle(string $status): string
    {
        return match ($status) {
            'approved' => 'Transfer disetujui',
            'in_transit' => 'Barang sedang dalam perjalanan',
            'arrived' => 'Barang sudah sampai',
            'completed' => 'Transfer selesai',
            'rejected' => 'Transfer ditolak',
            'cancelled' => 'Transfer dibatalkan',
            'discrepancy' => 'Ada selisih pada transfer',
            default => 'Status transfer diperbarui',
        };
    }

    public function createAdjustment(array $data, int $userId, string $userRole): StockMutation
    {
        $this->assertRole($userRole, UserRoles::STOCK_CONTROLLERS, 'Hanya Warehouse Manager atau Inventory Controller yang dapat melakukan adjustment stok.');

        return DB::transaction(function () use ($data, $userId) {
            $locationId = $data['warehouse_location_id'] ?? null;
            if (($data['warehouse_id'] ?? null) && ! $locationId) {
                $locationId = $this->selectAutomaticLocation(
                    $data['product_id'],
                    $data['warehouse_id'],
                    $data['type'] === 'increase' ? 'in' : 'out',
                    $data['quantity']
                );
            }

            $mutation = StockMutation::create([
                'product_id' => $data['product_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'warehouse_location_id' => $locationId,
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

    private function applyApprovedMutation(StockMutation $mutation, ?int $approvedBy = null): void
    {
        $this->ensureValidWarehouseLocationPair($mutation->warehouse_id, $mutation->warehouse_location_id);

        $product = Product::query()->lockForUpdate()->findOrFail($mutation->product_id);
        if ($mutation->type === 'in' && $mutation->warehouse_location_id) {
            $this->ensureInboundLocationAcceptsProduct($product, $mutation->warehouse_location_id, $mutation->quantity);
        }
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
        if (! $mutation->warehouse_id) {
            return;
        }

        $stock = ProductStock::query()
            ->where('product_id', $mutation->product_id)
            ->where('warehouse_id', $mutation->warehouse_id)
            ->where('warehouse_location_id', $mutation->warehouse_location_id)
            ->lockForUpdate()
            ->first();

        if (! $stock) {
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
        if (! $warehouseId) {
            return $fallbackQuantity;
        }

        return (int) ProductStock::query()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('warehouse_location_id', $warehouseLocationId)
            ->lockForUpdate()
            ->value('quantity') ?? 0;
    }

    private function selectAutomaticLocation(int $productId, int $warehouseId, string $direction, int $quantity, ?int $excludeLocationId = null): int
    {
        if ($direction === 'out') {
            $locationId = ProductStock::query()
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->whereNotNull('warehouse_location_id')
                ->where('quantity', '>=', $quantity)
                ->when($excludeLocationId, fn ($query) => $query->where('warehouse_location_id', '!=', $excludeLocationId))
                ->orderByDesc('quantity')
                ->value('warehouse_location_id');

            if (! $locationId) {
                throw new Exception('Tidak ada satu rak dengan stok yang mencukupi.', 422);
            }

            return (int) $locationId;
        }

        $product = Product::query()->findOrFail($productId);
        $locations = WarehouseLocation::query()
            ->with('categories:id')
            ->withSum('productStocks as used_capacity', 'quantity')
            ->where('warehouse_id', $warehouseId)
            ->where('status', 'active')
            ->when($excludeLocationId, fn ($query) => $query->where('id', '!=', $excludeLocationId))
            ->get();

        $selected = $locations->map(function (WarehouseLocation $location) use ($product, $quantity) {
            $used = (int) ($location->used_capacity ?? 0);
            $categoryIds = $location->categories->pluck('id');
            $compatible = $categoryIds->isEmpty() || $categoryIds->contains($product->category_id);
            $available = $location->capacity === null ? PHP_INT_MAX : $location->capacity - $used;

            return $compatible && $available >= $quantity
                ? ['id' => $location->id, 'available' => $available]
                : null;
        })->filter()->sortByDesc('available')->first();

        if (! $selected) {
            throw new Exception('Tidak ada rak aktif yang sesuai kategori dan kapasitas.', 422);
        }

        return (int) $selected['id'];
    }

    private function selectPrimaryWarehouseId(): int
    {
        $warehouse = Warehouse::query()
            ->where(function ($query) {
                $query
                    ->where('name', 'like', '%pusat%')
                    ->orWhere('name', 'like', '%utama%')
                    ->orWhere('name', 'like', '%main%');
            })
            ->orderBy('id')
            ->first()
            ?? Warehouse::query()->orderBy('id')->first();

        if (! $warehouse) {
            throw new Exception('Belum ada gudang utama yang tersedia.', 422);
        }

        return (int) $warehouse->id;
    }

    private function ensureValidWarehouseLocationPair(?int $warehouseId, ?int $locationId): void
    {
        if (! $locationId) {
            return;
        }

        if (! $warehouseId) {
            throw new Exception('Warehouse harus dipilih jika lokasi gudang digunakan.', 422);
        }

        $valid = WarehouseLocation::query()
            ->whereKey($locationId)
            ->where('warehouse_id', $warehouseId)
            ->exists();

        if (! $valid) {
            throw new Exception('Lokasi gudang tidak sesuai dengan warehouse yang dipilih.', 422);
        }
    }

    private function ensureInboundLocationAcceptsProduct(Product $product, int $locationId, int $quantity): void
    {
        $location = WarehouseLocation::query()
            ->with('categories:id')
            ->withSum('productStocks as used_capacity', 'quantity')
            ->findOrFail($locationId);

        if ($location->status !== 'active') {
            throw new Exception('Rak tujuan sedang tidak aktif.', 422);
        }

        if ($location->categories->isNotEmpty() && ! $location->categories->contains('id', $product->category_id)) {
            throw new Exception('Kategori produk tidak diizinkan pada rak tujuan.', 422);
        }

        if ($location->capacity !== null && ((int) ($location->used_capacity ?? 0) + $quantity) > $location->capacity) {
            throw new Exception('Kapasitas rak tujuan tidak mencukupi.', 422);
        }
    }

    private function assertTransferStatusRole(string $userRole, string $nextStatus): void
    {
        $allowedRoles = match ($nextStatus) {
            'approved', 'rejected', 'cancelled' => UserRoles::TRANSFER_APPROVERS,
            'in_transit', 'arrived' => UserRoles::TRANSFER_OPERATORS,
            'completed', 'discrepancy' => UserRoles::TRANSFER_COMPLETERS,
            default => [],
        };

        $message = match ($nextStatus) {
            'approved', 'rejected', 'cancelled' => 'Hanya Warehouse Manager yang dapat menyetujui, menolak, atau membatalkan transfer.',
            'in_transit', 'arrived' => 'Hanya Warehouse Manager atau Warehouse Staff yang dapat memproses pergerakan transfer.',
            'completed', 'discrepancy' => 'Hanya Warehouse Manager atau Inventory Controller yang dapat menyelesaikan atau menandai selisih transfer.',
            default => 'Role tidak memiliki otoritas untuk status transfer ini.',
        };

        $this->assertRole($userRole, $allowedRoles, $message);
    }

    private function assertRole(string $userRole, array $allowedRoles, string $message): void
    {
        if (! UserRoles::can(UserRoles::normalize($userRole), $allowedRoles)) {
            throw new Exception($message, 403);
        }
    }

    private function generateReferenceNumber(string $prefix): string
    {
        return $prefix.'-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));
    }
}
