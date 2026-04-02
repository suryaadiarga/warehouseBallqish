<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Suku Cadang Mesin'],
            ['name' => 'Kelistrikan'],
            ['name' => 'Ban & Velg'],
            ['name' => 'Pelumas & Cairan'],
            ['name' => 'Aksesoris Kendaraan'],
            ['name' => 'Peralatan Bengkel'],
            ['name' => 'Fast Moving Parts'],
            ['name' => 'Slow Moving Parts'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate($category);
        }
    }
}