<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $names = [
            'Piston Kit', 'Kampas Rem', 'Busi Iridium', 'Aki Motor',
            'Ban Luar', 'Ban Dalam', 'Oli Mesin', 'Minyak Rem',
            'Lampu LED', 'Filter Udara', 'Rantai Motor',
            'Gear Set', 'Shockbreaker', 'Spion', 'Handle Rem',
            'Kabel Gas', 'Kabel Kopling', 'Radiator Coolant',
            'Velg Racing', 'Klakson', 'Relay', 'Sekring',
            'Bearing Roda', 'Injector', 'Throttle Body', 'Kunci Sok',
            'Kunci Ring Pas', 'Multimeter Digital', 'Dongkrak Hidrolik',
        ];

        $name = $this->faker->randomElement($names).' '.$this->faker->randomElement(['Honda', 'Yamaha', 'Suzuki', 'Kawasaki']).' '.$this->faker->bothify('Seri ??-##');

        return [
            'category_id' => Category::inRandomOrder()->value('id') ?? 1,
            'supplier_id' => Supplier::inRandomOrder()->value('id'),
            'sku' => $this->faker->unique()->bothify('???-#####'),
            'name' => $name,
            'stock' => $this->faker->numberBetween(0, 100),
            'min_stock_level' => $this->faker->numberBetween(5, 20),
            'lead_time_days' => $this->faker->numberBetween(3, 14),
            'safety_stock' => $this->faker->numberBetween(3, 15),
            'price' => $this->faker->numberBetween(20000, 500000),
        ];
    }
}
