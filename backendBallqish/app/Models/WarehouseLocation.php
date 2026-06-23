<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id',
        'code',
        'name',
        'zone',
        'aisle',
        'level',
        'capacity',
        'status',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'capacity' => 'integer',
        ];
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function productStocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class)->withTimestamps();
    }
}
