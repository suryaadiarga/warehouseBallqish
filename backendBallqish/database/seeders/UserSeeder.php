<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@warehouse.com'], [
            'name' => 'Admin Ballqish',
            'email' => 'admin@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => 'admin_gudang',
        ]);

        User::updateOrCreate(['email' => 'staff@warehouse.com'], [
            'name' => 'Staff Gudang',
            'email' => 'staff@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
        ]);
    }
}
