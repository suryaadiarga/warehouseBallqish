<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMutationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Mengubah data mentah DB menjadi format JSON yang konsisten
        return [
            'id' => $this->id,
            'type' => strtoupper($this->type), // in -> IN
            'quantity' => $this->quantity,
            'status' => $this->status,
            'note' => $this->note,
            'product_name' => $this->whenLoaded('product', fn() => $this->product->name),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}