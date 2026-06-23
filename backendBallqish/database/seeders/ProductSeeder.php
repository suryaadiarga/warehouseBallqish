<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $total = 632;
        $chunkSize = 200;
        $created = 0;
        $now = now();

        $categories = Category::pluck('id')->toArray();
        mt_srand(20260622);
        fake()->seed(20260622);

        while ($created < $total) {
            $count = min($chunkSize, $total - $created);
            $data = Product::factory()
                ->count($count)
                ->make()
                ->map(function ($item) use ($categories, $now) {
                    $item->category_id = $categories[array_rand($categories)];

                    return [
                        ...$item->toArray(),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })
                ->toArray();

            Product::insert($data);
            $created += $count;
        }
    }
}
