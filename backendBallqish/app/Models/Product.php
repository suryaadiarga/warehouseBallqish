<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'supplier_id',
        'sku',
        'name',
        'image_key',
        'stock',
        'min_stock_level',
        'lead_time_days',
        'safety_stock',
        'price',
    ];

    protected $appends = [
        'image_url',
        'image_is_illustration',
    ];

    public function getImageUrlAttribute(): string
    {
        $key = $this->image_key ?: config('product_images.default', 'default-product');

        return "/product-images/{$key}.webp";
    }

    public function getImageIsIllustrationAttribute(): bool
    {
        return true;
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
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
