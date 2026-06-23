<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Database\Seeder;

class ProductStockSeeder extends Seeder
{
    public function run(): void
    {
        ProductStock::query()->delete();

        $centralWarehouse = Warehouse::query()->where('name', 'Gudang Pusat')->firstOrFail();
        $transitWarehouse = Warehouse::query()->where('name', 'Gudang Transit')->firstOrFail();
        $centralRacks = WarehouseLocation::query()
            ->where('warehouse_id', $centralWarehouse->id)
            ->get()
            ->keyBy('code');
        $transitRack = WarehouseLocation::query()
            ->where('warehouse_id', $transitWarehouse->id)
            ->where('code', 'T3')
            ->firstOrFail();

        $rackByCategory = [
            'Sistem Pengereman' => 'A1',
            'Aksesoris Kendaraan' => 'A2',
            'Suku Cadang Mesin' => 'B1',
            'Kelistrikan' => 'B2',
            'Ban & Velg' => 'C1',
            'Pelumas & Cairan' => 'D1',
            'Peralatan Bengkel' => 'E1',
        ];
        $now = now();
        $rows = [];

        Product::query()
            ->with('category:id,name')
            ->select(['id', 'category_id', 'stock'])
            ->chunkById(500, function ($products) use (&$rows, $rackByCategory, $centralRacks, $centralWarehouse, $transitWarehouse, $transitRack, $now) {
                foreach ($products as $product) {
                    $totalStock = max((int) $product->stock, 0);
                    $transitQuantity = $totalStock >= 20 ? (int) floor($totalStock * 0.15) : 0;
                    $centralQuantity = $totalStock - $transitQuantity;
                    $rackCode = $rackByCategory[$product->category?->name] ?? 'B1';
                    $centralRack = $centralRacks[$rackCode];

                    $rows[] = [
                        'product_id' => $product->id,
                        'warehouse_id' => $centralWarehouse->id,
                        'warehouse_location_id' => $centralRack->id,
                        'quantity' => $centralQuantity,
                        'reserved_quantity' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if ($transitQuantity > 0) {
                        $rows[] = [
                            'product_id' => $product->id,
                            'warehouse_id' => $transitWarehouse->id,
                            'warehouse_location_id' => $transitRack->id,
                            'quantity' => $transitQuantity,
                            'reserved_quantity' => 0,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                if (count($rows) >= 1000) {
                    ProductStock::query()->insert($rows);
                    $rows = [];
                }
            });

        if ($rows !== []) {
            ProductStock::query()->insert($rows);
        }
    }
}
