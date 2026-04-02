<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::insert([
            ['name' => 'Gudang Pusat', 'location' => 'Surabaya'],
            ['name' => 'Gudang Transit', 'location' => 'Sidoarjo'],
        ]);
    }
}