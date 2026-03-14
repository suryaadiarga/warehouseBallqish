<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $category = Category::create(['name' => 'suku cadang']);

        Product::create([
            'category_id' => $category->id,
            'sku' => 'BRG-001',
            'name' => 'Ban Dunlop',
            'stock' => '20',
            'price' => '750000',
        ]);
        Product::create([
            'category_id' => $category->id,
            'sku' => 'BRG-002',
            'name' => 'Kampas Rem',
            'stock' => '5',
            'price' => '15000',
        ]);
        Product::create([
            'category_id' => $category->id,
            'sku' => 'BRG-003',
            'name' => 'Filter Udara',
            'stock' => '5',
            'price' => '120000',
        ]);
    }
}
