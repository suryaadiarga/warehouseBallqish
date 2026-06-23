<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
    ];

    public function locations()
    {
        return $this->hasMany(WarehouseLocation::class);
    }

    public function productStocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    public function stockMutations()
    {
        return $this->hasMany(StockMutation::class);
    }

    public function outgoingTransfers()
    {
        return $this->hasMany(StockMutation::class, 'from_warehouse_id');
    }

    public function incomingTransfers()
    {
        return $this->hasMany(StockMutation::class, 'to_warehouse_id');
    }

}
