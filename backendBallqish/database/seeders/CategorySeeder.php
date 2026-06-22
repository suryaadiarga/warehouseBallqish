<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Sistem Pengereman'],
            ['name' => 'Suku Cadang Mesin'],
            ['name' => 'Kelistrikan'],
            ['name' => 'Ban & Velg'],
            ['name' => 'Pelumas & Cairan'],
            ['name' => 'Aksesoris Kendaraan'],
            ['name' => 'Peralatan Bengkel'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate($category);
        }
    }
}
