<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMutation;
use Illuminate\Database\Seeder;

class ProductStockSeeder extends Seeder
{
    public function run(): void
    {
        ProductStock::query()->delete();
        $latestByScope = [];

        StockMutation::query()
            ->where('status', 'approved')
            ->whereNotNull('warehouse_id')
            ->whereNotNull('warehouse_location_id')
            ->orderBy('id')
            ->select(['id', 'product_id', 'warehouse_id', 'warehouse_location_id', 'after_qty'])
            ->chunkById(2000, function ($mutations) use (&$latestByScope) {
                foreach ($mutations as $mutation) {
                    $key = "{$mutation->product_id}:{$mutation->warehouse_id}:{$mutation->warehouse_location_id}";
                    $latestByScope[$key] = [
                        'product_id' => $mutation->product_id,
                        'warehouse_id' => $mutation->warehouse_id,
                        'warehouse_location_id' => $mutation->warehouse_location_id,
                        'quantity' => (int) $mutation->after_qty,
                    ];
                }
            });

        $now = now();
        foreach (array_chunk(array_values($latestByScope), 1000) as $chunk) {
            ProductStock::query()->insert(array_map(fn (array $row) => [
                ...$row,
                'reserved_quantity' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ], $chunk));
        }

        Product::query()->select('id')->chunkById(500, function ($products) {
            foreach ($products as $product) {
                $product->update([
                    'stock' => (int) ProductStock::query()->where('product_id', $product->id)->sum('quantity'),
                ]);
            }
        });
    }
}
