<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Membuat User Admin agar temanmu bisa login dari Next.js
        User::create([
            'name' => 'Admin Warehouse',
            'email' => 'admin@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => 'admin_gudang',
        ]);

        // Memanggil Seeder Produk
        $this->call([
            ProductSeeder::class,
        ]);
    }
}