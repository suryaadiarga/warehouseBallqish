<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Services\ProductImageResolver;
use Illuminate\Database\Seeder;
use RuntimeException;

class ProductSeeder extends Seeder
{
    private const TOTAL_PRODUCTS = 632;

    public function run(): void
    {
        Product::query()->delete();

        $categories = Category::query()->pluck('id', 'name');
        $suppliers = Supplier::query()->pluck('id', 'name');
        $now = now();
        $rows = [];
        $sequence = 0;
        $imageResolver = app(ProductImageResolver::class);

        foreach ($this->catalog() as $categoryName => $config) {
            for ($index = 0; $index < $config['count']; $index++) {
                $sequence++;
                $base = $config['items'][$index % count($config['items'])];
                $brand = $config['brands'][intdiv($index, count($config['items'])) % count($config['brands'])];
                $variant = $config['variants'][intdiv($index, count($config['items']) * count($config['brands'])) % count($config['variants'])];
                $supplierName = $config['suppliers'][$index % count($config['suppliers'])];

                $rows[] = [
                    'category_id' => $categories[$categoryName],
                    'supplier_id' => $suppliers[$supplierName],
                    'sku' => $config['prefix'].'-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                    'barcode' => '899'.str_pad((string) $sequence, 10, '0', STR_PAD_LEFT),
                    'name' => "{$base} {$brand} {$variant}",
                    'image_key' => $imageResolver->resolve("{$base} {$brand} {$variant}", $config['prefix'].'-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT)),
                    'stock' => 0,
                    'min_stock_level' => 5 + (($sequence * 7) % 16),
                    'lead_time_days' => 3 + (($sequence * 5) % 12),
                    'safety_stock' => 3 + (($sequence * 3) % 13),
                    'price' => 20000 + (($sequence * 13750) % 980000),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (count($rows) !== self::TOTAL_PRODUCTS) {
            throw new RuntimeException('Jumlah katalog produk harus tepat '.self::TOTAL_PRODUCTS.'.');
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            Product::query()->insert($chunk);
        }
    }

    private function catalog(): array
    {
        $vehicleBrands = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa', 'TVS'];
        $vehicleVariants = ['Beat', 'Vario', 'Scoopy', 'NMAX', 'Aerox', 'Mio', 'Satria', 'Ninja', 'PCX', 'ADV', 'GSX', 'KLX'];

        return [
            'Sistem Pengereman' => [
                'count' => 80, 'prefix' => 'BRK',
                'items' => ['Kampas Rem Depan', 'Kampas Rem Belakang', 'Master Rem', 'Kaliper Rem', 'Piringan Cakram', 'Selang Rem', 'Handle Rem', 'Seal Master Rem'],
                'brands' => $vehicleBrands, 'variants' => $vehicleVariants,
                'suppliers' => ['PT Astra Otoparts', 'PT Denso Sales Indonesia'],
            ],
            'Suku Cadang Mesin' => [
                'count' => 210, 'prefix' => 'ENG',
                'items' => ['Piston Kit', 'Ring Piston', 'Blok Silinder', 'Klep Mesin', 'Rantai Keteng', 'Gear Set', 'Bearing Kruk As', 'Injector', 'Throttle Body', 'Filter Udara', 'Kabel Gas', 'Kabel Kopling', 'Shockbreaker', 'Gasket Mesin'],
                'brands' => $vehicleBrands, 'variants' => $vehicleVariants,
                'suppliers' => ['PT Astra Otoparts', 'PT Denso Sales Indonesia'],
            ],
            'Kelistrikan' => [
                'count' => 100, 'prefix' => 'ELC',
                'items' => ['Busi Iridium', 'Aki Motor', 'Lampu Utama LED', 'Lampu Sein', 'Klakson', 'Relay Starter', 'Sekring', 'Koil Pengapian', 'Regulator Kiprok', 'Dinamo Starter'],
                'brands' => $vehicleBrands, 'variants' => $vehicleVariants,
                'suppliers' => ['PT Denso Sales Indonesia', 'PT Astra Otoparts'],
            ],
            'Ban & Velg' => [
                'count' => 75, 'prefix' => 'WHL',
                'items' => ['Ban Luar Depan', 'Ban Luar Belakang', 'Ban Dalam', 'Velg Racing', 'Pentil Tubeless', 'Bearing Roda', 'Jari-jari Roda'],
                'brands' => ['Michelin', 'IRC', 'FDR', 'Pirelli', 'Bridgestone'],
                'variants' => ['80/90-14', '90/90-14', '100/80-14', '70/90-17', '80/90-17', '90/80-17', '110/70-17', '120/70-17'],
                'suppliers' => ['PT Michelin Indonesia'],
            ],
            'Pelumas & Cairan' => [
                'count' => 70, 'prefix' => 'LUB',
                'items' => ['Oli Mesin', 'Oli Gardan', 'Minyak Rem', 'Radiator Coolant', 'Cairan Pembersih Injektor', 'Pelumas Rantai', 'Grease Bearing'],
                'brands' => ['Pertamina', 'Enduro', 'Federal', 'Motul', 'Castrol'],
                'variants' => ['800 ml', '1 Liter', '10W-30', '10W-40', '20W-40', 'DOT 3', 'DOT 4', '500 ml'],
                'suppliers' => ['PT Pertamina Lubricants'],
            ],
            'Aksesoris Kendaraan' => [
                'count' => 47, 'prefix' => 'ACC',
                'items' => ['Spion', 'Handgrip', 'Box Motor', 'Cover Motor', 'Holder Ponsel', 'Footstep', 'Visor', 'Jok Motor'],
                'brands' => $vehicleBrands, 'variants' => ['Hitam', 'Silver', 'Merah', 'Biru', 'Universal', 'Sport'],
                'suppliers' => ['PT Astra Otoparts'],
            ],
            'Peralatan Bengkel' => [
                'count' => 50, 'prefix' => 'TLS',
                'items' => ['Kunci Ring Pas', 'Kunci Sok', 'Kunci T', 'Kunci Inggris', 'Tang Kombinasi', 'Obeng Set', 'Dongkrak Hidrolik', 'Multimeter Digital', 'Pompa Gemuk', 'Kompresor Mini'],
                'brands' => ['Tekiro', 'Krisbow', 'Bosch', 'Makita', 'Stanley'],
                'variants' => ['Set 8 pcs', 'Set 12 pcs', 'Ukuran Kecil', 'Ukuran Sedang', 'Ukuran Besar', 'Heavy Duty'],
                'suppliers' => ['PT Tekiro Tools Indonesia'],
            ],
        ];
    }
}
