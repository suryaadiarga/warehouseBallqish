<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransferStatusHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'stock_transfer_id',
        'user_id',
        'from_status',
        'to_status',
        'note',
        'created_at',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
