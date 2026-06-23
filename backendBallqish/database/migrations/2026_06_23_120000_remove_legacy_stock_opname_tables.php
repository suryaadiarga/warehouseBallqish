<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('stock_mutations')
            ->where('mutation_source', 'opname')
            ->update([
                'mutation_source' => 'adjustment',
                'reason' => DB::raw("COALESCE(reason, 'Penyesuaian stok historis')"),
            ]);

        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
    }

    public function down(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['draft', 'completed'])->default('draft');
            $table->text('note')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_opname_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('system_qty');
            $table->integer('physical_qty');
            $table->integer('selisih');
            $table->timestamps();
            $table->unique(['stock_opname_id', 'product_id']);
        });
    }
};
