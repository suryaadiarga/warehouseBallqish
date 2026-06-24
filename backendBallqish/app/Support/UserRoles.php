<?php

namespace App\Support;

final class UserRoles
{
    public const SUPER_ADMIN = 'super_admin';
    public const WAREHOUSE_MANAGER = 'warehouse_manager';
    public const WAREHOUSE_STAFF = 'warehouse_staff';
    public const INVENTORY_CONTROLLER = 'inventory_controller';

    public const ALL = [
        self::SUPER_ADMIN,
        self::WAREHOUSE_MANAGER,
        self::WAREHOUSE_STAFF,
        self::INVENTORY_CONTROLLER,
    ];

    public const TRANSFER_CREATORS = [
        self::WAREHOUSE_MANAGER,
        self::WAREHOUSE_STAFF,
    ];

    public const TRANSFER_APPROVERS = [
        self::WAREHOUSE_MANAGER,
    ];

    public const TRANSFER_OPERATORS = [
        self::WAREHOUSE_MANAGER,
        self::WAREHOUSE_STAFF,
    ];

    public const TRANSFER_COMPLETERS = [
        self::WAREHOUSE_MANAGER,
        self::INVENTORY_CONTROLLER,
    ];

    public const STOCK_CONTROLLERS = [
        self::WAREHOUSE_MANAGER,
        self::INVENTORY_CONTROLLER,
    ];

    public const MUTATION_APPROVERS = [
        self::WAREHOUSE_MANAGER,
        self::INVENTORY_CONTROLLER,
    ];

    public const EMERGENCY_OVERRIDES = [
        self::SUPER_ADMIN,
    ];

    public static function can(string $role, array $allowedRoles, bool $allowSuperAdmin = true): bool
    {
        return in_array($role, $allowedRoles, true)
            || ($allowSuperAdmin && $role === self::SUPER_ADMIN);
    }

    public static function normalize(?string $role): string
    {
        return match ($role) {
            null, '' => self::WAREHOUSE_STAFF,
            default => $role,
        };
    }
}
