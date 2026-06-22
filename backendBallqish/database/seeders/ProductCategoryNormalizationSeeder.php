<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductCategoryNormalizationSeeder extends Seeder
{
    public function run(): void
    {
        $categoryIds = Category::query()->pluck('id', 'name');

        Product::query()->update(['category_id' => $categoryIds['Suku Cadang Mesin']]);

        $rules = [
            'Sistem Pengereman' => ['Kampas Rem', 'Handle Rem'],
            'Kelistrikan' => ['Busi Iridium', 'Aki Motor', 'Lampu LED', 'Klakson', 'Relay', 'Sekring'],
            'Ban & Velg' => ['Ban Luar', 'Ban Dalam', 'Velg Racing'],
            'Pelumas & Cairan' => ['Oli Mesin', 'Minyak Rem', 'Radiator Coolant'],
            'Aksesoris Kendaraan' => ['Spion'],
        ];

        foreach ($rules as $categoryName => $productNames) {
            Product::query()
                ->where(function ($query) use ($productNames) {
                    foreach ($productNames as $productName) {
                        $query->orWhere('name', 'like', $productName.'%');
                    }
                })
                ->update(['category_id' => $categoryIds[$categoryName]]);
        }

        Category::query()
            ->whereIn('name', ['Fast Moving Parts', 'Slow Moving Parts'])
            ->whereDoesntHave('products')
            ->delete();
    }
}
