<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAuditItem extends Model
{
    protected $fillable = ['stock_audit_id', 'product_id', 'system_qty', 'physical_qty', 'difference', 'counted_at'];

    protected function casts(): array
    {
        return ['counted_at' => 'datetime'];
    }

    public function audit()
    {
        return $this->belongsTo(StockAudit::class, 'stock_audit_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
