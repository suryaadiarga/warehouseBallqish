<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedSmallInteger('lead_time_days')->default(7)->after('min_stock_level');
            $table->unsignedInteger('safety_stock')->default(0)->after('lead_time_days');
        });

        DB::table('products')->update(['safety_stock' => DB::raw('min_stock_level')]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['lead_time_days', 'safety_stock']);
        });
    }
};
