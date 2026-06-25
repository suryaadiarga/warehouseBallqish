<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\UserRoles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Warehouse Manager', 'email' => 'admin@warehouse.com', 'role' => UserRoles::WAREHOUSE_MANAGER],
            ['name' => 'Warehouse Staff', 'email' => 'staff@warehouse.com', 'role' => UserRoles::WAREHOUSE_STAFF],
            ['name' => 'Inventory Controller', 'email' => 'inventory@warehouse.com', 'role' => UserRoles::INVENTORY_CONTROLLER],
            ['name' => 'Owner Ballqish', 'email' => 'boss@warehouse.com', 'role' => UserRoles::SUPER_ADMIN],
        ];

        foreach (range(1, 3) as $number) {
            $accounts[] = [
                'name' => "Admin {$number}",
                'email' => "admin{$number}@warehouse.com",
                'role' => UserRoles::WAREHOUSE_MANAGER,
            ];
            $accounts[] = [
                'name' => "Staff {$number}",
                'email' => "staff{$number}@warehouse.com",
                'role' => UserRoles::WAREHOUSE_STAFF,
            ];
            $accounts[] = [
                'name' => "Inventory {$number}",
                'email' => "inventory{$number}@warehouse.com",
                'role' => UserRoles::INVENTORY_CONTROLLER,
            ];
        }

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    ...$account,
                    'password' => Hash::make('password123'),
                ]
            );
        }
    }
}
