<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin Balqish',
            'email' => 'admin@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => 'admin_gudang',
        ]);

        User::create([
            'name' => 'Staff Gudang',
            'email' => 'staff@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
        ]);
    }
}