<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use RuntimeException;

class StockMutationSeeder extends Seeder
{
    private const EXPECTED_PRODUCTS = 632;

    private const EXPECTED_MUTATIONS = 63000;

    public function run(): void
    {
        mt_srand(20260622);
        StockMutation::query()->delete();

        $staff = User::query()->where('role', 'staff')->firstOrFail();
        $admin = User::query()->where('role', 'admin_gudang')->firstOrFail();
        $products = Product::query()->with('category:id,name')->orderBy('id')->get();

        if ($products->count() !== self::EXPECTED_PRODUCTS) {
            throw new RuntimeException('StockMutationSeeder membutuhkan tepat '.self::EXPECTED_PRODUCTS.' produk.');
        }

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
            'Sistem Pengereman' => 'A',
            'Suku Cadang Mesin' => 'B',
            'Kelistrikan' => 'C',
            'Ban & Velg' => 'D',
            'Pelumas & Cairan' => 'E',
            'Aksesoris Kendaraan' => 'F',
            'Peralatan Bengkel' => 'G',
        ];

        $endDate = CarbonImmutable::now()->startOfMinute();
        $mutationNumber = 0;
        $productOffset = 0;
        $insertRows = [];

        foreach ($this->profiles() as $profile) {
            $profileProducts = $products->slice($productOffset, $profile['products']);
            $productOffset += $profile['products'];

            foreach ($profileProducts as $product) {
                $events = $this->generateEvents($profile, $endDate);
                $targetStock = $this->targetStock($profile['name'], (int) $product->min_stock_level, $events, $endDate);
                $cumulative = 0;
                $minimumCumulative = 0;

                foreach ($events as $event) {
                    $cumulative += $event['type'] === 'in' ? $event['quantity'] : -$event['quantity'];
                    $minimumCumulative = min($minimumCumulative, $cumulative);
                }

                $openingStock = $targetStock - $cumulative;
                if ($openingStock + $minimumCumulative < 0) {
                    $targetStock += abs($openingStock + $minimumCumulative);
                    $openingStock = $targetStock - $cumulative;
                }

                $product->update(['stock' => $targetStock]);
                $runningStock = $openingStock;
                $rackPrefix = $rackByCategory[$product->category?->name] ?? 'B';
                $centralRackCode = $rackPrefix.(($product->id - 1) % 5 + 1);
                $centralRack = $centralRacks[$centralRackCode];

                foreach ($events as $eventIndex => $event) {
                    $mutationNumber++;
                    $beforeQuantity = $runningStock;
                    $runningStock += $event['type'] === 'in' ? $event['quantity'] : -$event['quantity'];
                    $useTransitWarehouse = $eventIndex % 7 === 0;
                    $warehouse = $useTransitWarehouse ? $transitWarehouse : $centralWarehouse;
                    $warehouseLocation = $useTransitWarehouse ? $transitRack : $centralRack;

                    $insertRows[] = [
                        'reference_number' => 'TRX-SEED-'.str_pad((string) $mutationNumber, 6, '0', STR_PAD_LEFT),
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'warehouse_location_id' => $warehouseLocation->id,
                        'from_warehouse_id' => null,
                        'to_warehouse_id' => null,
                        'user_id' => $staff->id,
                        'approved_by' => $admin->id,
                        'mutation_source' => 'manual',
                        'transfer_id' => null,
                        'type' => $event['type'],
                        'quantity' => $event['quantity'],
                        'status' => 'approved',
                        'note' => 'Synthetic profile: '.$profile['name'],
                        'reason' => null,
                        'before_qty' => $beforeQuantity,
                        'after_qty' => $runningStock,
                        'created_at' => $event['date'],
                        'updated_at' => $event['date'],
                    ];

                    if (count($insertRows) >= 1000) {
                        StockMutation::query()->insert($insertRows);
                        $insertRows = [];
                    }
                }
            }
        }

        if ($insertRows !== []) {
            StockMutation::query()->insert($insertRows);
        }

        if ($mutationNumber !== self::EXPECTED_MUTATIONS) {
            throw new RuntimeException("Jumlah mutasi seed tidak sesuai: {$mutationNumber}.");
        }
    }

    private function profiles(): array
    {
        return [
            ['name' => 'critical_fast', 'products' => 80, 'events' => 150, 'outbound_percent' => 80, 'min_quantity' => 3, 'max_quantity' => 9],
            ['name' => 'warning', 'products' => 120, 'events' => 120, 'outbound_percent' => 65, 'min_quantity' => 1, 'max_quantity' => 5],
            ['name' => 'safe', 'products' => 252, 'events' => 90, 'outbound_percent' => 50, 'min_quantity' => 1, 'max_quantity' => 4],
            ['name' => 'intermittent', 'products' => 100, 'events' => 70, 'outbound_percent' => 20, 'min_quantity' => 2, 'max_quantity' => 8],
            ['name' => 'demand_spike', 'products' => 40, 'events' => 140, 'outbound_percent' => 82, 'min_quantity' => 1, 'max_quantity' => 4],
            ['name' => 'dead_stock', 'products' => 40, 'events' => 33, 'outbound_percent' => 35, 'min_quantity' => 1, 'max_quantity' => 4],
        ];
    }

    private function generateEvents(array $profile, CarbonImmutable $endDate): array
    {
        $events = [];

        for ($index = 0; $index < $profile['events']; $index++) {
            $type = mt_rand(1, 100) <= $profile['outbound_percent'] ? 'out' : 'in';
            $quantity = mt_rand($profile['min_quantity'], $profile['max_quantity']);
            $date = $this->eventDate($profile['name'], $index, $profile['events'], $endDate);

            if ($profile['name'] === 'demand_spike' && $date->greaterThanOrEqualTo($endDate->subDays(14)) && $type === 'out') {
                $quantity = mt_rand(8, 18);
            }

            $events[] = ['type' => $type, 'quantity' => $quantity, 'date' => $date];
        }

        usort($events, fn (array $left, array $right) => $left['date']->getTimestamp() <=> $right['date']->getTimestamp());

        return $events;
    }

    private function eventDate(string $profile, int $index, int $eventCount, CarbonImmutable $endDate): CarbonImmutable
    {
        if ($profile === 'dead_stock') {
            $daysAgo = 89 - (int) floor(($index * 58) / max($eventCount - 1, 1));
        } elseif ($profile === 'demand_spike') {
            $olderEventCount = (int) floor($eventCount * 0.6);
            if ($index < $olderEventCount) {
                $daysAgo = 89 - (int) floor(($index * 74) / max($olderEventCount - 1, 1));
            } else {
                $recentIndex = $index - $olderEventCount;
                $recentCount = $eventCount - $olderEventCount;
                $daysAgo = 14 - (int) floor(($recentIndex * 14) / max($recentCount - 1, 1));
            }
        } else {
            $daysAgo = 89 - (int) floor(($index * 89) / max($eventCount - 1, 1));
        }

        if ($daysAgo === 0) {
            return $endDate->subMinutes(mt_rand(0, min(720, max(0, $endDate->hour * 60 + $endDate->minute))));
        }

        return $endDate
            ->subDays($daysAgo)
            ->setTime(mt_rand(7, 18), mt_rand(0, 59), mt_rand(0, 59));
    }

    private function targetStock(string $profile, int $minimumStock, array $events, CarbonImmutable $endDate): int
    {
        $recentOutbound = array_reduce(
            $events,
            fn (int $total, array $event) => $total + ($event['type'] === 'out' && $event['date']->greaterThanOrEqualTo($endDate->subDays(30)) ? $event['quantity'] : 0),
            0
        );
        $averageDailyUsage = $recentOutbound / 30;

        return match ($profile) {
            'critical_fast', 'demand_spike' => max(1, (int) floor($minimumStock / 3)),
            'warning' => max($minimumStock, (int) ceil($averageDailyUsage * 10)),
            'safe' => max($minimumStock * 5, (int) ceil($averageDailyUsage * 45)),
            'intermittent' => max($minimumStock * 3, (int) ceil($averageDailyUsage * 45)),
            'dead_stock' => $minimumStock * 10,
            default => $minimumStock * 2,
        };
    }
}
