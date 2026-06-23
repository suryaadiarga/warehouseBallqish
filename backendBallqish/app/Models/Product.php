<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'sku',
        'name',
        'stock',
        'min_stock_level',
        'lead_time_days',
        'safety_stock',
        'price',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function productStocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    public function stockMutations()
    {
        return $this->hasMany(StockMutation::class);
    }

}
