<?php

namespace App\Http\Requests;

use App\Models\WarehouseLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreStockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'exists:products,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'warehouse_location_id' => ['nullable', 'exists:warehouse_locations,id'],
            'type' => ['required', 'in:increase,decrease'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string'],
            'note' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $warehouseId = $this->input('warehouse_id');
            $locationId = $this->input('warehouse_location_id');

            if ($locationId && !$warehouseId) {
                $validator->errors()->add('warehouse_id', 'warehouse_id wajib diisi jika warehouse_location_id dipilih.');
            }

            if ($warehouseId && $locationId && !WarehouseLocation::whereKey($locationId)->where('warehouse_id', $warehouseId)->exists()) {
                $validator->errors()->add('warehouse_location_id', 'Lokasi gudang tidak sesuai dengan warehouse yang dipilih.');
            }
        });
    }
}
