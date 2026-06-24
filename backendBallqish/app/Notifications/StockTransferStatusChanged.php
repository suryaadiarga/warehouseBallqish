<?php

namespace App\Notifications;

use App\Models\StockTransfer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StockTransferStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        private readonly StockTransfer $transfer,
        private readonly string $title,
        private readonly string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'stock_transfer',
            'title' => $this->title,
            'message' => $this->message,
            'transfer_id' => $this->transfer->id,
            'transfer_number' => $this->transfer->transfer_number,
            'status' => $this->transfer->status,
        ];
    }
}
