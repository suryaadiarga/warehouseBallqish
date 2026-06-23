<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warehouse_locations', function (Blueprint $table) {
            $table->string('zone', 50)->nullable()->after('name');
            $table->string('aisle', 50)->nullable()->after('zone');
            $table->unsignedSmallInteger('level')->nullable()->after('aisle');
            $table->unsignedInteger('capacity')->nullable()->after('level');
            $table->string('status', 20)->default('active')->after('capacity')->index();
        });

        Schema::create('category_warehouse_location', function (Blueprint $table) {
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_location_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['category_id', 'warehouse_location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_warehouse_location');

        Schema::table('warehouse_locations', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['zone', 'aisle', 'level', 'capacity', 'status']);
        });
    }
};
