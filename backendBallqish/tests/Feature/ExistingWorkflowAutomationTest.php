<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DeviceToken;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Services\StockAuditService;
use App\Services\StockMutationService;
use App\Support\UserRoles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExistingWorkflowAutomationTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_mutation_selects_rack_automatically(): void
    {
        [$user, $product, $warehouse, $source] = $this->fixture();

        $mutation = app(StockMutationService::class)->createDraft([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'out',
            'quantity' => 4,
        ], $user->id);

        $this->assertSame($source->id, $mutation->warehouse_location_id);
        $this->assertSame('draft', $mutation->status);
    }

    public function test_transfer_chooses_source_and_destination_racks_automatically(): void
    {
        [, $product, $warehouse, $source, $destination] = $this->fixture();
        $manager = User::factory()->create(['role' => UserRoles::WAREHOUSE_MANAGER]);
        $staff = User::factory()->create(['role' => UserRoles::WAREHOUSE_STAFF]);
        $controller = User::factory()->create(['role' => UserRoles::INVENTORY_CONTROLLER]);

        $service = app(StockMutationService::class);
        $transfer = $service->createTransfer([
            'product_id' => $product->id,
            'from_warehouse_id' => $warehouse->id,
            'to_warehouse_id' => $warehouse->id,
            'quantity' => 4,
        ], $staff->id, $staff->role);

        $this->assertSame('pending', $transfer->status);
        $this->assertSame($source->id, $transfer->from_warehouse_location_id);
        $this->assertSame($destination->id, $transfer->to_warehouse_location_id);
        $this->assertDatabaseHas('product_stocks', ['product_id' => $product->id, 'warehouse_location_id' => $source->id, 'quantity' => 10]);

        $transfer = $service->updateTransferStatus($transfer, 'approved', [], $manager->id, $manager->role);
        $transfer = $service->updateTransferStatus($transfer, 'in_transit', [], $staff->id, $staff->role);
        $this->assertDatabaseHas('product_stocks', ['product_id' => $product->id, 'warehouse_location_id' => $source->id, 'quantity' => 6]);

        $transfer = $service->updateTransferStatus($transfer, 'arrived', [], $staff->id, $staff->role);
        $transfer = $service->updateTransferStatus($transfer, 'completed', ['received_quantity' => 4], $controller->id, $controller->role);
        $this->assertSame('completed', $transfer->status);
        $this->assertDatabaseHas('product_stocks', ['product_id' => $product->id, 'warehouse_location_id' => $destination->id, 'quantity' => 4]);
        $this->assertDatabaseCount('stock_transfer_status_histories', 5);
    }

    public function test_transfer_notifications_follow_operational_roles(): void
    {
        [, $product, $warehouse] = $this->fixture();
        $manager = User::factory()->create(['role' => UserRoles::WAREHOUSE_MANAGER]);
        $staff = User::factory()->create(['role' => UserRoles::WAREHOUSE_STAFF]);
        $controller = User::factory()->create(['role' => UserRoles::INVENTORY_CONTROLLER]);
        $boss = User::factory()->create(['role' => UserRoles::SUPER_ADMIN]);
        $service = app(StockMutationService::class);

        $transfer = $service->createTransfer([
            'product_id' => $product->id,
            'from_warehouse_id' => $warehouse->id,
            'to_warehouse_id' => $warehouse->id,
            'quantity' => 2,
        ], $staff->id, $staff->role);

        $this->assertSame(1, $manager->notifications()->count());
        $this->assertSame(0, $staff->notifications()->count());
        $this->assertSame(0, $controller->notifications()->count());
        $this->assertSame(0, $boss->notifications()->count());

        $transfer = $service->updateTransferStatus($transfer, 'approved', [], $manager->id, $manager->role);
        $this->assertSame(1, $staff->notifications()->where('data->status', 'approved')->count());

        $transfer = $service->updateTransferStatus($transfer, 'in_transit', [], $staff->id, $staff->role);
        $this->assertSame(1, $manager->notifications()->where('data->status', 'in_transit')->count());
        $this->assertSame(1, $controller->notifications()->where('data->status', 'in_transit')->count());

        $transfer = $service->updateTransferStatus($transfer, 'arrived', [], $staff->id, $staff->role);
        $this->assertSame(1, $manager->notifications()->where('data->status', 'arrived')->count());
        $this->assertSame(1, $controller->notifications()->where('data->status', 'arrived')->count());

        $service->updateTransferStatus($transfer, 'completed', ['received_quantity' => 2], $controller->id, $controller->role);
        $this->assertSame(1, $manager->notifications()->where('data->status', 'completed')->count());
        $this->assertSame(1, $staff->notifications()->where('data->status', 'completed')->count());
        $this->assertSame(0, $boss->notifications()->count());
    }

    public function test_transfer_status_roles_are_enforced(): void
    {
        [, $product, $warehouse] = $this->fixture();
        $staff = User::factory()->create(['role' => UserRoles::WAREHOUSE_STAFF]);
        $controller = User::factory()->create(['role' => UserRoles::INVENTORY_CONTROLLER]);
        $service = app(StockMutationService::class);

        $transfer = $service->createTransfer([
            'product_id' => $product->id,
            'from_warehouse_id' => $warehouse->id,
            'to_warehouse_id' => $warehouse->id,
            'quantity' => 2,
        ], $staff->id, $staff->role);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Hanya Warehouse Manager yang dapat menyetujui, menolak, atau membatalkan transfer.');

        $service->updateTransferStatus($transfer, 'approved', [], $controller->id, $controller->role);
    }

    public function test_user_can_register_and_remove_device_token(): void
    {
        $user = User::factory()->create(['role' => UserRoles::WAREHOUSE_STAFF]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/device-tokens', [
                'token' => 'fcm-token-sample',
                'platform' => 'android',
            ])
            ->assertOk();

        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $user->id,
            'token_hash' => hash('sha256', 'fcm-token-sample'),
            'platform' => 'android',
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/device-tokens', [
                'token' => 'fcm-token-sample',
            ])
            ->assertOk();

        $this->assertSame(0, DeviceToken::query()->where('user_id', $user->id)->count());
    }

    public function test_adjustment_selects_rack_and_applies_mutation_automatically(): void
    {
        [$user, $product, $warehouse, $source] = $this->fixture();

        $mutation = app(StockMutationService::class)->createAdjustment([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'decrease',
            'quantity' => 2,
            'reason' => 'Barang rusak',
        ], $user->id, $user->role);

        $this->assertSame($source->id, $mutation->warehouse_location_id);
        $this->assertSame('approved', $mutation->status);
        $this->assertDatabaseHas('product_stocks', ['warehouse_location_id' => $source->id, 'quantity' => 8]);
    }

    public function test_operational_movement_records_supplier_receipt_and_customer_dispatch(): void
    {
        [$user, $product, $warehouse, $source, $destination] = $this->fixture();
        $supplier = Supplier::create(['name' => 'Supplier Uji', 'contact' => '08123456789']);
        $product->update(['supplier_id' => $supplier->id]);
        $service = app(StockMutationService::class);

        $inbound = $service->createOperationalMovement([
            'type' => 'in',
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 3,
            'note' => 'Barang datang dari supplier',
        ], $user->id, UserRoles::WAREHOUSE_STAFF);

        $this->assertSame('approved', $inbound->status);
        $this->assertSame('supplier_receipt', $inbound->mutation_source);
        $this->assertSame($destination->id, $inbound->warehouse_location_id);
        $this->assertDatabaseHas('product_stocks', ['warehouse_location_id' => $source->id, 'quantity' => 10]);
        $this->assertDatabaseHas('product_stocks', ['warehouse_location_id' => $destination->id, 'quantity' => 3]);

        $outbound = $service->createOperationalMovement([
            'type' => 'out',
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'destination_type' => 'customer',
            'quantity' => 2,
            'note' => 'Pembelian customer',
        ], $user->id, UserRoles::WAREHOUSE_STAFF);

        $this->assertSame('approved', $outbound->status);
        $this->assertSame('customer_dispatch', $outbound->mutation_source);
        $this->assertSame($source->id, $outbound->warehouse_location_id);
        $this->assertDatabaseHas('product_stocks', ['warehouse_location_id' => $source->id, 'quantity' => 8]);
    }

    public function test_stock_audit_reconciles_the_exact_rack(): void
    {
        [$user, $product, $warehouse, $source] = $this->fixture();
        $service = app(StockAuditService::class);

        $audit = $service->create(['warehouse_id' => $warehouse->id, 'warehouse_location_id' => $source->id], $user->id);
        $service->recordCounts($audit->id, [['product_id' => $product->id, 'physical_qty' => 8]]);
        $completed = $service->complete($audit->id, $user->id);

        $this->assertSame('completed', $completed->status);
        $this->assertDatabaseHas('product_stocks', ['warehouse_location_id' => $source->id, 'quantity' => 8]);
        $this->assertDatabaseHas('stock_mutations', ['mutation_source' => 'stock_audit', 'quantity' => 2, 'status' => 'approved']);
    }

    public function test_inbound_rejects_rack_from_another_category(): void
    {
        [$user, $product, $warehouse] = $this->fixture();
        $otherCategory = Category::create(['name' => 'Kelistrikan']);
        $wrongRack = WarehouseLocation::create(['warehouse_id' => $warehouse->id, 'code' => 'C1', 'name' => 'Rak Kelistrikan', 'capacity' => 100, 'status' => 'active']);
        $wrongRack->categories()->attach($otherCategory->id);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Kategori produk tidak diizinkan pada rak tujuan.');

        app(StockMutationService::class)->createAdjustment([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'warehouse_location_id' => $wrongRack->id,
            'type' => 'increase',
            'quantity' => 1,
            'reason' => 'Uji kategori',
        ], $user->id, $user->role);
    }

    private function fixture(): array
    {
        $user = User::factory()->create(['role' => UserRoles::WAREHOUSE_MANAGER]);
        $category = Category::create(['name' => 'Sistem Pengereman']);
        $product = Product::create(['category_id' => $category->id, 'sku' => 'SKU-AUTO-1', 'barcode' => 'AUTO-1', 'name' => 'Kampas Rem', 'stock' => 10, 'min_stock_level' => 5, 'price' => 100000]);
        $warehouse = Warehouse::create(['name' => 'Gudang Uji', 'location' => 'Surabaya']);
        $source = WarehouseLocation::create(['warehouse_id' => $warehouse->id, 'code' => 'A1', 'name' => 'Rak Sumber', 'capacity' => 100, 'status' => 'active']);
        $destination = WarehouseLocation::create(['warehouse_id' => $warehouse->id, 'code' => 'A2', 'name' => 'Rak Tujuan', 'capacity' => 100, 'status' => 'active']);
        $source->categories()->attach($category->id);
        $destination->categories()->attach($category->id);
        ProductStock::create(['product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'warehouse_location_id' => $source->id, 'quantity' => 10, 'reserved_quantity' => 0]);

        return [$user, $product, $warehouse, $source, $destination];
    }
}
