<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockMutation;
use App\Models\Product;
use App\Models\User;

class StockMutationSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('role', 'staff')->first();
        $admin = User::where('role', 'admin_gudang')->first();

        $products = Product::inRandomOrder()->take(200)->get();

        foreach ($products as $product) {
            StockMutation::create([
                'reference_number' => 'TRX-' . strtoupper(uniqid()),
                'product_id' => $product->id,
                'user_id' => $user->id,
                'approved_by' => $admin->id,
                'type' => rand(0,1) ? 'in' : 'out',
                'quantity' => rand(1, 20),
                'status' => 'approved',
                'note' => 'Auto generated mutation',
            ]);
        }
    }
}