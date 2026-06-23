<?php

namespace Database\Factories;

use App\Models\Category;
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
            'Bearing Roda', 'Injector', 'Throttle Body',
        ];

        $prefix = ['MES', 'ELK', 'BAN', 'OLI', 'AKS', 'TLS'];

        $name = $this->faker->randomElement($names).' '.$this->faker->randomElement(['Honda', 'Yamaha', 'Suzuki']);

        return [
            'category_id' => Category::inRandomOrder()->value('id') ?? 1,
            'sku' => $this->faker->unique()->bothify('???-#####'),
            'name' => $name,
            'stock' => $this->faker->numberBetween(0, 100),
            'min_stock_level' => $this->faker->numberBetween(5, 20),
            'price' => $this->faker->numberBetween(20000, 500000),
        ];
    }
}
