<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransfer extends Model
{
    public const STATUSES = [
        'pending',
        'approved',
        'in_transit',
        'arrived',
        'completed',
        'rejected',
        'cancelled',
        'discrepancy',
    ];

    protected $fillable = [
        'transfer_number',
        'product_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'from_warehouse_location_id',
        'to_warehouse_location_id',
        'created_by',
        'updated_by',
        'out_mutation_id',
        'in_mutation_id',
        'status',
        'quantity',
        'received_quantity',
        'estimated_arrival_at',
        'approved_at',
        'departed_at',
        'arrived_at',
        'completed_at',
        'note',
        'discrepancy_note',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'received_quantity' => 'integer',
            'estimated_arrival_at' => 'datetime',
            'approved_at' => 'datetime',
            'departed_at' => 'datetime',
            'arrived_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function fromWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function fromLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'from_warehouse_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'to_warehouse_location_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function histories()
    {
        return $this->hasMany(StockTransferStatusHistory::class);
    }
}
