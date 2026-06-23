<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Services\ProductImageResolver;
use Illuminate\Database\Seeder;

class ProductImageSeeder extends Seeder
{
    public function run(): void
    {
        $resolver = app(ProductImageResolver::class);

        Product::query()
            ->select(['id', 'sku', 'name'])
            ->orderBy('id')
            ->chunkById(200, function ($products) use ($resolver) {
                foreach ($products as $product) {
                    $product->updateQuietly([
                        'image_key' => $resolver->resolve($product->name, $product->sku),
                    ]);
                }
            });
    }
}
