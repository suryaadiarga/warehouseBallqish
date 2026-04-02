<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StockMutation extends Model
{
    protected $fillable = ['product_id', 'type', 'quantity', 'status', 'note'];

    public function product()
    {
        return $this->belongsTo(Product::class);
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
}