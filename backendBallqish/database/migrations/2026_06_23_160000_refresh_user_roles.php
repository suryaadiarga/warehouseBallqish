<?php

use App\Support\UserRoles;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'admin_gudang')->update(['role' => UserRoles::WAREHOUSE_MANAGER]);
        DB::table('users')->where('role', 'superadmin')->update(['role' => UserRoles::WAREHOUSE_MANAGER]);
        DB::table('users')->where('role', 'staff')->update(['role' => UserRoles::WAREHOUSE_STAFF]);

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default(UserRoles::WAREHOUSE_STAFF)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default(UserRoles::WAREHOUSE_STAFF)->change();
        });
    }
};
