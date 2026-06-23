<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Database\Seeders\CategorySeeder;
use Database\Seeders\WarehouseLocationSeeder;
use Database\Seeders\WarehouseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WarehouseRackTest extends TestCase
{
    use RefreshDatabase;

    public function test_rack_can_store_layout_capacity_and_allowed_categories(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $warehouse = Warehouse::create(['name' => 'Gudang Uji']);
        $category = Category::create(['name' => 'Sistem Pengereman']);

        $response = $this->postJson('/api/warehouse-locations', [
            'warehouse_id' => $warehouse->id,
            'code' => 'A1',
            'name' => 'Rak Sistem Pengereman',
            'zone' => 'A',
            'aisle' => 'Komponen Kendaraan',
            'level' => 1,
            'capacity' => 1500,
            'status' => 'active',
            'category_ids' => [$category->id],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.code', 'A1')
            ->assertJsonPath('data.capacity', 1500)
            ->assertJsonPath('data.categories.0.name', 'Sistem Pengereman');

        $this->assertDatabaseHas('category_warehouse_location', [
            'category_id' => $category->id,
            'warehouse_location_id' => $response->json('data.id'),
        ]);
    }

    public function test_warehouse_detail_contains_rack_summary(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $warehouse = Warehouse::create(['name' => 'Gudang Uji']);
        $warehouse->locations()->create([
            'code' => 'B1',
            'name' => 'Rak Mesin',
            'capacity' => 1000,
            'status' => 'active',
        ]);

        $this->getJson("/api/warehouses/{$warehouse->id}")
            ->assertOk()
            ->assertJsonPath('data.rack_count', 1)
            ->assertJsonPath('data.locations.0.code', 'B1');
    }

    public function test_seeded_central_racks_use_five_racks_per_category(): void
    {
        $this->seed([CategorySeeder::class, WarehouseSeeder::class, WarehouseLocationSeeder::class]);
        $central = Warehouse::where('name', 'Gudang Pusat')->firstOrFail();

        $this->assertSame(['A1', 'A2', 'A3', 'A4', 'A5'], WarehouseLocation::where('warehouse_id', $central->id)->where('status', 'active')->where('zone', 'A')->orderBy('code')->pluck('code')->all());
        $this->assertSame(35, WarehouseLocation::where('warehouse_id', $central->id)->where('status', 'active')->count());
        $this->assertTrue(WarehouseLocation::where('warehouse_id', $central->id)->where('code', 'A5')->whereHas('categories', fn ($query) => $query->where('name', 'Sistem Pengereman'))->exists());
    }
}
