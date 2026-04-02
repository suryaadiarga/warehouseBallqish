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
            if ($this->status !== 'draft') return false;

            // Jika barang MASUK, stok bertambah 
            if ($this->type === 'in') {
                $this->product->increment('stock', $this->quantity);
            } 
            // Jika barang KELUAR, stok berkurang
            else {
                $this->product->decrement('stock', $this->quantity);
            }

            return $this->update(['status' => 'approved']);
        });
    }
}
