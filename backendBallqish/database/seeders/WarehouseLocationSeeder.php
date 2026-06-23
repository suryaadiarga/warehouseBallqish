<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Database\Seeder;

class WarehouseLocationSeeder extends Seeder
{
    public function run(): void
    {
        $allCategoryIds = Category::query()->pluck('id')->all();

        $racks = [
            'Gudang Pusat' => [
                ['code' => 'A1', 'name' => 'Rak Sistem Pengereman', 'zone' => 'A', 'aisle' => 'Komponen Kendaraan', 'level' => 1, 'capacity' => 45000, 'categories' => ['Sistem Pengereman']],
                ['code' => 'A2', 'name' => 'Rak Aksesori Kendaraan', 'zone' => 'A', 'aisle' => 'Komponen Kendaraan', 'level' => 1, 'capacity' => 25000, 'categories' => ['Aksesoris Kendaraan']],
                ['code' => 'B1', 'name' => 'Rak Suku Cadang Mesin', 'zone' => 'B', 'aisle' => 'Mesin dan Kelistrikan', 'level' => 1, 'capacity' => 220000, 'categories' => ['Suku Cadang Mesin']],
                ['code' => 'B2', 'name' => 'Rak Kelistrikan', 'zone' => 'B', 'aisle' => 'Mesin dan Kelistrikan', 'level' => 2, 'capacity' => 130000, 'categories' => ['Kelistrikan']],
                ['code' => 'C1', 'name' => 'Area Ban dan Velg', 'zone' => 'C', 'aisle' => 'Barang Berukuran Besar', 'level' => 1, 'capacity' => 70000, 'categories' => ['Ban & Velg']],
                ['code' => 'D1', 'name' => 'Rak Pelumas dan Cairan', 'zone' => 'D', 'aisle' => 'Cairan', 'level' => 1, 'capacity' => 70000, 'categories' => ['Pelumas & Cairan']],
                ['code' => 'E1', 'name' => 'Rak Peralatan Bengkel', 'zone' => 'E', 'aisle' => 'Peralatan', 'level' => 1, 'capacity' => 30000, 'categories' => ['Peralatan Bengkel']],
            ],
            'Gudang Transit' => [
                ['code' => 'T1', 'name' => 'Barang Masuk', 'zone' => 'T', 'aisle' => 'Inbound', 'level' => 1, 'capacity' => 100000, 'categories' => null],
                ['code' => 'T2', 'name' => 'Menunggu Pemeriksaan', 'zone' => 'T', 'aisle' => 'Quality Check', 'level' => 1, 'capacity' => 80000, 'categories' => null],
                ['code' => 'T3', 'name' => 'Siap Transfer', 'zone' => 'T', 'aisle' => 'Outbound', 'level' => 1, 'capacity' => 90000, 'categories' => null],
                ['code' => 'T4', 'name' => 'Barang Bermasalah', 'zone' => 'T', 'aisle' => 'Quarantine', 'level' => 1, 'capacity' => 30000, 'categories' => null],
            ],
        ];

        foreach ($racks as $warehouseName => $warehouseRacks) {
            $warehouse = Warehouse::query()->where('name', $warehouseName)->firstOrFail();

            foreach ($warehouseRacks as $rack) {
                $location = WarehouseLocation::query()->updateOrCreate(
                    ['warehouse_id' => $warehouse->id, 'code' => $rack['code']],
                    [
                        'name' => $rack['name'],
                        'zone' => $rack['zone'],
                        'aisle' => $rack['aisle'],
                        'level' => $rack['level'],
                        'capacity' => $rack['capacity'],
                        'status' => 'active',
                        'description' => "Lokasi operasional {$rack['name']} di {$warehouseName}.",
                    ]
                );

                $categoryIds = $rack['categories'] === null
                    ? $allCategoryIds
                    : Category::query()->whereIn('name', $rack['categories'])->pluck('id')->all();

                $location->categories()->sync($categoryIds);
            }
        }
    }
}
