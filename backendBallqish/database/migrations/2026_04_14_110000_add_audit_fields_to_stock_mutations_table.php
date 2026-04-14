<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->string('mutation_source')->default('manual')->after('reference_number');
            $table->string('transfer_id')->nullable()->after('mutation_source')->index();
            $table->foreignId('from_warehouse_id')->nullable()->after('warehouse_location_id')->constrained('warehouses')->nullOnDelete();
            $table->foreignId('to_warehouse_id')->nullable()->after('from_warehouse_id')->constrained('warehouses')->nullOnDelete();
            $table->text('reason')->nullable()->after('note');
            $table->integer('before_qty')->nullable()->after('reason');
            $table->integer('after_qty')->nullable()->after('before_qty');
        });
    }

    public function down(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('to_warehouse_id');
            $table->dropConstrainedForeignId('from_warehouse_id');
            $table->dropColumn([
                'mutation_source',
                'transfer_id',
                'reason',
                'before_qty',
                'after_qty',
            ]);
        });
    }
};
