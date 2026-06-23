<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Services\InventoryAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InventoryAnalyticsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_movement_analysis_uses_a_constant_number_of_queries(): void
    {
        $category = Category::create(['name' => 'Sparepart']);
        $user = User::factory()->create();

        $products = collect(range(1, 10))->map(fn (int $index) => Product::create([
            'category_id' => $category->id,
            'sku' => "SKU-$index",
            'name' => "Produk $index",
            'stock' => 100,
            'min_stock_level' => 10,
            'price' => 10000,
        ]));

        foreach ($products->take(3) as $product) {
            StockMutation::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'type' => 'out',
                'quantity' => 30,
                'status' => 'approved',
            ]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();

        $analysis = app(InventoryAnalyticsService::class)->buildMovementAnalysis();
        $queryCount = count(DB::getQueryLog());

        DB::disableQueryLog();

        $this->assertCount(10, $analysis);
        $this->assertLessThanOrEqual(3, $queryCount);
        $this->assertSame(1, $analysis->firstWhere('product_id', $products->first()->id)['avg_daily_usage']);
    }
}
