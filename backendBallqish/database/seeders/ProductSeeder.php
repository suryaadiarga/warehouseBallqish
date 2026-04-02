<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $total = 10000;
        $chunk = 500; // per batch

        $categories = Category::pluck('id')->toArray();

        for ($i = 0; $i < $total / $chunk; $i++) {
            $data = Product::factory()
                ->count($chunk)
                ->make()
                ->map(function ($item) use ($categories) {
                    $item->category_id = $categories[array_rand($categories)];
                    return $item->toArray();
                })
                ->toArray();

            Product::insert($data);
        }
    }
}