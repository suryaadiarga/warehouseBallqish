<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number')->unique();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('from_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('to_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('from_warehouse_location_id')->constrained('warehouse_locations')->restrictOnDelete();
            $table->foreignId('to_warehouse_location_id')->constrained('warehouse_locations')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('out_mutation_id')->nullable()->constrained('stock_mutations')->nullOnDelete();
            $table->foreignId('in_mutation_id')->nullable()->constrained('stock_mutations')->nullOnDelete();
            $table->string('status')->default('pending')->index();
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('received_quantity')->nullable();
            $table->timestamp('estimated_arrival_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('departed_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('note')->nullable();
            $table->text('discrepancy_note')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_transfer_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('stock_transfer_status_histories');
        Schema::dropIfExists('stock_transfers');
    }
};
