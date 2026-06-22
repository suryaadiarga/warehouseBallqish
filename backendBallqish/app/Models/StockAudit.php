<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAudit extends Model
{
    protected $fillable = ['audit_number', 'warehouse_id', 'warehouse_location_id', 'user_id', 'completed_by', 'status', 'snapshot_at', 'completed_at', 'note'];

    protected function casts(): array
    {
        return ['snapshot_at' => 'datetime', 'completed_at' => 'datetime'];
    }

    public function items()
    {
        return $this->hasMany(StockAuditItem::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function completer()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
