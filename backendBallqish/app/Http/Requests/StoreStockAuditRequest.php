<?php

namespace App\Http\Requests;

use App\Models\WarehouseLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreStockAuditRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'warehouse_location_id' => ['required', 'exists:warehouse_locations,id'],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! WarehouseLocation::whereKey($this->warehouse_location_id)->where('warehouse_id', $this->warehouse_id)->exists()) {
                $validator->errors()->add('warehouse_location_id', 'Rak tidak berada pada gudang yang dipilih.');
            }
        });
    }
}
