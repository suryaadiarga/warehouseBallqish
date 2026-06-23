<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->index(
                ['status', 'type', 'created_at', 'product_id'],
                'stock_mutations_analytics_idx'
            );
            $table->index(
                ['status', 'type', 'warehouse_id', 'created_at', 'product_id'],
                'stock_mutations_warehouse_analytics_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->dropIndex('stock_mutations_analytics_idx');
            $table->dropIndex('stock_mutations_warehouse_analytics_idx');
        });
    }
};
