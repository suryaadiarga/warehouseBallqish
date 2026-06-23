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
        $central = Warehouse::query()->where('name', 'Gudang Pusat')->firstOrFail();
        $rackGroups = [
            'Sistem Pengereman' => ['prefix' => 'A', 'label' => 'Sistem Pengereman', 'aisle' => 'Komponen Pengereman', 'capacity' => 12000],
            'Suku Cadang Mesin' => ['prefix' => 'B', 'label' => 'Suku Cadang Mesin', 'aisle' => 'Komponen Mesin', 'capacity' => 50000],
            'Kelistrikan' => ['prefix' => 'C', 'label' => 'Kelistrikan', 'aisle' => 'Komponen Kelistrikan', 'capacity' => 30000],
            'Ban & Velg' => ['prefix' => 'D', 'label' => 'Ban dan Velg', 'aisle' => 'Barang Berukuran Besar', 'capacity' => 16000],
            'Pelumas & Cairan' => ['prefix' => 'E', 'label' => 'Pelumas dan Cairan', 'aisle' => 'Cairan', 'capacity' => 16000],
            'Aksesoris Kendaraan' => ['prefix' => 'F', 'label' => 'Aksesoris Kendaraan', 'aisle' => 'Aksesoris', 'capacity' => 6000],
            'Peralatan Bengkel' => ['prefix' => 'G', 'label' => 'Peralatan Bengkel', 'aisle' => 'Peralatan', 'capacity' => 8000],
        ];

        $existingByCategory = [];
        foreach (array_keys($rackGroups) as $categoryName) {
            $existingByCategory[$categoryName] = WarehouseLocation::query()
                ->where('warehouse_id', $central->id)
                ->whereHas('categories', fn ($query) => $query->where('name', $categoryName))
                ->withCount('productStocks')
                ->orderByDesc('product_stocks_count')
                ->orderBy('id')
                ->take(5)
                ->get()
                ->values();
        }

        WarehouseLocation::query()
            ->where('warehouse_id', $central->id)
            ->get()
            ->each(fn (WarehouseLocation $location) => $location->update(['code' => 'TMP-'.$location->id]));

        foreach ($rackGroups as $categoryName => $group) {
            $category = Category::query()->where('name', $categoryName)->firstOrFail();
            for ($number = 1; $number <= 5; $number++) {
                $code = $group['prefix'].$number;
                $location = $existingByCategory[$categoryName]->get($number - 1) ?? new WarehouseLocation;
                if ($location->exists) {
                    $location->refresh();
                }

                $location->fill([
                    'warehouse_id' => $central->id,
                    'code' => $code,
                    'name' => "Rak {$group['label']} {$code}",
                    'zone' => $group['prefix'],
                    'aisle' => $group['aisle'],
                    'level' => $number,
                    'capacity' => $group['capacity'],
                    'status' => 'active',
                    'description' => "Khusus kategori {$categoryName}; kapasitas {$group['capacity']} unit.",
                ])->save();
                $location->categories()->sync([$category->id]);
            }
        }

        WarehouseLocation::query()
            ->where('warehouse_id', $central->id)
            ->where('code', 'like', 'TMP-%')
            ->update(['status' => 'inactive']);

        $transit = Warehouse::query()->where('name', 'Gudang Transit')->firstOrFail();
        $transitRacks = [
            ['code' => 'T1', 'name' => 'Barang Masuk', 'aisle' => 'Inbound', 'capacity' => 100000],
            ['code' => 'T2', 'name' => 'Menunggu Pemeriksaan', 'aisle' => 'Quality Check', 'capacity' => 80000],
            ['code' => 'T3', 'name' => 'Siap Transfer', 'aisle' => 'Outbound', 'capacity' => 90000],
            ['code' => 'T4', 'name' => 'Barang Bermasalah', 'aisle' => 'Quarantine', 'capacity' => 30000],
        ];
        foreach ($transitRacks as $rack) {
            $location = WarehouseLocation::query()->updateOrCreate(
                ['warehouse_id' => $transit->id, 'code' => $rack['code']],
                ['name' => $rack['name'], 'zone' => 'T', 'aisle' => $rack['aisle'], 'level' => 1, 'capacity' => $rack['capacity'], 'status' => 'active', 'description' => "Area transit {$rack['name']}."],
            );
            $location->categories()->sync($allCategoryIds);
        }
    }
}
