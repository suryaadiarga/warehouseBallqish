<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StockMutation extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'warehouse_location_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'user_id',
        'approved_by',
        'reference_number',
        'mutation_source',
        'transfer_id',
        'type',
        'quantity',
        'status',
        'note',
        'reason',
        'before_qty',
        'after_qty',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class);
    }

    public function fromWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function user() {
    return $this->belongsTo(User::class);
}

    public function approve()
    {
        return DB::transaction(function () {
            if ($this->status === 'approved') {
                throw new \Exception("Transaksi ini sudah disetujui sebelumnya.");
            }

            $product = $this->product;

            if ($this->type === 'in') {
                $product->increment('stock', $this->quantity);
            } else {
                // VALIDASI: Cek apakah stok cukup sebelum dikurangi
                if ($product->stock < $this->quantity) {
                    throw new \Exception("Stok tidak mencukupi untuk transaksi ini! Sisa stok: " . $product->stock);
                }
                $product->decrement('stock', $this->quantity);
            }

            $this->status = 'approved';
            $this->save();

            return $this;
        });
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
