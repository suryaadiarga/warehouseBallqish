<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWarehouseLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('warehouse_locations', 'code')->where(
                    fn ($query) => $query->where('warehouse_id', $this->integer('warehouse_id'))
                )->ignore($this->route('id')),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
