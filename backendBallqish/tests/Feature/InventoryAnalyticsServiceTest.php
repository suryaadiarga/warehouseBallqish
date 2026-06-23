<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Services\InventoryAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
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
                'quantity' => 90,
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

    public function test_hybrid_forecast_selects_croston_for_intermittent_demand(): void
    {
        $category = Category::create(['name' => 'Intermittent']);
        $user = User::factory()->create();
        $product = Product::create(['category_id' => $category->id, 'sku' => 'INT-001', 'name' => 'Produk Intermittent', 'stock' => 30, 'min_stock_level' => 10, 'lead_time_days' => 7, 'safety_stock' => 10, 'price' => 10000]);

        foreach ([75, 60, 45, 30, 15, 0] as $daysAgo) {
            StockMutation::forceCreate(['product_id' => $product->id, 'user_id' => $user->id, 'type' => 'out', 'quantity' => 5, 'status' => 'approved', 'mutation_source' => 'manual', 'created_at' => Carbon::now()->subDays($daysAgo), 'updated_at' => Carbon::now()->subDays($daysAgo)]);
        }

        $analysis = app(InventoryAnalyticsService::class)->buildProductAnalysis($product->load('category'));

        $this->assertSame('croston_sba', $analysis['forecast_method']);
        $this->assertIsInt($analysis['forecast_daily_usage']);
        $this->assertGreaterThan(0, $analysis['confidence_score']);
    }

    public function test_critical_score_detects_recent_demand_spike_and_lead_time_risk(): void
    {
        $category = Category::create(['name' => 'Fast']);
        $user = User::factory()->create();
        $product = Product::create(['category_id' => $category->id, 'sku' => 'SPIKE-001', 'name' => 'Produk Spike', 'stock' => 8, 'min_stock_level' => 10, 'lead_time_days' => 7, 'safety_stock' => 10, 'price' => 10000]);

        for ($daysAgo = 27; $daysAgo >= 7; $daysAgo--) {
            StockMutation::forceCreate(['product_id' => $product->id, 'user_id' => $user->id, 'type' => 'out', 'quantity' => 1, 'status' => 'approved', 'mutation_source' => 'manual', 'created_at' => Carbon::now()->subDays($daysAgo), 'updated_at' => Carbon::now()->subDays($daysAgo)]);
        }
        for ($daysAgo = 6; $daysAgo >= 0; $daysAgo--) {
            StockMutation::forceCreate(['product_id' => $product->id, 'user_id' => $user->id, 'type' => 'out', 'quantity' => 8, 'status' => 'approved', 'mutation_source' => 'manual', 'created_at' => Carbon::now()->subDays($daysAgo), 'updated_at' => Carbon::now()->subDays($daysAgo)]);
        }

        $analysis = app(InventoryAnalyticsService::class)->buildProductAnalysis($product->load('category'));

        $this->assertTrue($analysis['demand_spike']);
        $this->assertSame('critical', $analysis['status']);
        $this->assertGreaterThanOrEqual(60, $analysis['critical_score']);
        $this->assertNotEmpty($analysis['risk_reasons']);
    }

    public function test_product_without_outbound_for_10_to_30_days_is_slow_moving(): void
    {
        Carbon::setTestNow('2026-06-23 12:00:00');

        $category = Category::create(['name' => 'Slow']);
        $user = User::factory()->create();
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'SLOW-001',
            'name' => 'Produk Slow-moving',
            'stock' => 25,
            'min_stock_level' => 10,
            'lead_time_days' => 7,
            'safety_stock' => 10,
            'price' => 10000,
        ]);

        StockMutation::forceCreate([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'type' => 'out',
            'quantity' => 2,
            'status' => 'approved',
            'mutation_source' => 'manual',
            'created_at' => Carbon::now()->subDays(10),
            'updated_at' => Carbon::now()->subDays(10),
        ]);

        $analysis = app(InventoryAnalyticsService::class)->buildProductAnalysis($product->load('category'));

        $this->assertSame(10, $analysis['days_since_last_outbound']);
        $this->assertSame('slow_moving', $analysis['movement_status']);
        $this->assertTrue($analysis['is_slow_moving']);
        $this->assertFalse($analysis['is_dead_stock']);
        $this->assertIsInt($analysis['forecast_daily_usage']);
    }

    public function test_product_without_outbound_for_more_than_30_days_is_dead_stock(): void
    {
        Carbon::setTestNow('2026-06-23 12:00:00');

        $category = Category::create(['name' => 'Dead']);
        $user = User::factory()->create();
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'DEAD-001',
            'name' => 'Produk Dead Stock',
            'stock' => 25,
            'min_stock_level' => 10,
            'lead_time_days' => 7,
            'safety_stock' => 10,
            'price' => 10000,
        ]);

        StockMutation::forceCreate([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'type' => 'out',
            'quantity' => 2,
            'status' => 'approved',
            'mutation_source' => 'manual',
            'created_at' => Carbon::now()->subDays(31),
            'updated_at' => Carbon::now()->subDays(31),
        ]);

        $analysis = app(InventoryAnalyticsService::class)->buildProductAnalysis($product->load('category'));

        $this->assertSame(31, $analysis['days_since_last_outbound']);
        $this->assertSame('dead_stock', $analysis['movement_status']);
        $this->assertFalse($analysis['is_slow_moving']);
        $this->assertTrue($analysis['is_dead_stock']);
    }

    public function test_zero_stock_is_stock_out_instead_of_dead_stock(): void
    {
        Carbon::setTestNow('2026-06-23 12:00:00');

        $category = Category::create(['name' => 'Stock Out']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'OUT-001',
            'name' => 'Produk Stock Habis',
            'stock' => 0,
            'min_stock_level' => 10,
            'lead_time_days' => 7,
            'safety_stock' => 10,
            'price' => 10000,
            'created_at' => Carbon::now()->subDays(60),
            'updated_at' => Carbon::now()->subDays(60),
        ]);

        $analysis = app(InventoryAnalyticsService::class)->buildProductAnalysis($product->load('category'));

        $this->assertSame('stock_out', $analysis['movement_status']);
        $this->assertFalse($analysis['is_dead_stock']);
    }
}
