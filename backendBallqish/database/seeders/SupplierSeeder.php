<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::insert([
            ['name' => 'PT Astra Otoparts', 'contact' => '081234567890'],
            ['name' => 'PT Pertamina Lubricants', 'contact' => '082233445566'],
            ['name' => 'PT Michelin Indonesia', 'contact' => '083344556677'],
        ]);
    }
}