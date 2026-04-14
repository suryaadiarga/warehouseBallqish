<?php

namespace App\Http\Requests;

use App\Models\WarehouseLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreStockTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'exists:products,id'],
            'from_warehouse_id' => ['required', 'exists:warehouses,id', 'different:to_warehouse_id'],
            'to_warehouse_id' => ['required', 'exists:warehouses,id'],
            'from_warehouse_location_id' => ['nullable', 'exists:warehouse_locations,id'],
            'to_warehouse_location_id' => ['nullable', 'exists:warehouse_locations,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $fromWarehouseId = $this->integer('from_warehouse_id');
            $toWarehouseId = $this->integer('to_warehouse_id');
            $fromLocationId = $this->input('from_warehouse_location_id');
            $toLocationId = $this->input('to_warehouse_location_id');

            if ($fromLocationId && !WarehouseLocation::whereKey($fromLocationId)->where('warehouse_id', $fromWarehouseId)->exists()) {
                $validator->errors()->add('from_warehouse_location_id', 'Lokasi asal tidak sesuai dengan gudang asal.');
            }

            if ($toLocationId && !WarehouseLocation::whereKey($toLocationId)->where('warehouse_id', $toWarehouseId)->exists()) {
                $validator->errors()->add('to_warehouse_location_id', 'Lokasi tujuan tidak sesuai dengan gudang tujuan.');
            }
        });
    }
}
