<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'PT Astra Otoparts', 'contact' => '081234567890'],
            ['name' => 'PT Pertamina Lubricants', 'contact' => '082233445566'],
            ['name' => 'PT Michelin Indonesia', 'contact' => '083344556677'],
            ['name' => 'PT Tekiro Tools Indonesia', 'contact' => '081355667788'],
            ['name' => 'PT Denso Sales Indonesia', 'contact' => '082166778899'],
        ] as $supplier) {
            Supplier::query()->updateOrCreate(['name' => $supplier['name']], $supplier);
        }
    }
}
