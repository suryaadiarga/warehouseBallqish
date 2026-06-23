<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            WarehouseSeeder::class,
            WarehouseLocationSeeder::class,
            SupplierSeeder::class,
            ProductSeeder::class,
            StockMutationSeeder::class,
            ProductStockSeeder::class,
            WorkflowDatasetSeeder::class,
        ]);
    }
}
