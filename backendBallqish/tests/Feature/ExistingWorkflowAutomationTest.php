<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Services\StockAuditService;
use App\Services\StockMutationService;
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
        [$user, $product, $warehouse, $source, $destination] = $this->fixture();

        $result = app(StockMutationService::class)->createTransfer([
            'product_id' => $product->id,
            'from_warehouse_id' => $warehouse->id,
            'to_warehouse_id' => $warehouse->id,
            'quantity' => 4,
        ], $user->id, $user->role);

        $this->assertSame($source->id, $result['mutations'][0]->warehouse_location_id);
        $this->assertSame($destination->id, $result['mutations'][1]->warehouse_location_id);
        $this->assertDatabaseHas('product_stocks', ['product_id' => $product->id, 'warehouse_location_id' => $source->id, 'quantity' => 6]);
        $this->assertDatabaseHas('product_stocks', ['product_id' => $product->id, 'warehouse_location_id' => $destination->id, 'quantity' => 4]);
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

    private function fixture(): array
    {
        $user = User::factory()->create(['role' => 'admin_gudang']);
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
