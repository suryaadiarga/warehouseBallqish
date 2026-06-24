<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Support\UserRoles;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@warehouse.com'], [
            'name' => 'Warehouse Manager',
            'email' => 'admin@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => UserRoles::WAREHOUSE_MANAGER,
        ]);

        User::updateOrCreate(['email' => 'staff@warehouse.com'], [
            'name' => 'Warehouse Staff',
            'email' => 'staff@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => UserRoles::WAREHOUSE_STAFF,
        ]);

        User::updateOrCreate(['email' => 'inventory@warehouse.com'], [
            'name' => 'Inventory Controller',
            'email' => 'inventory@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => UserRoles::INVENTORY_CONTROLLER,
        ]);

        User::updateOrCreate(['email' => 'boss@warehouse.com'], [
            'name' => 'Owner Ballqish',
            'email' => 'boss@warehouse.com',
            'password' => Hash::make('password123'),
            'role' => UserRoles::SUPER_ADMIN,
        ]);
    }
}
