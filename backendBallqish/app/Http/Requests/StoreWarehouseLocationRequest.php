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
            'zone' => ['nullable', 'string', 'max:50'],
            'aisle' => ['nullable', 'string', 'max:50'],
            'level' => ['nullable', 'integer', 'min:1', 'max:100'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'maintenance'])],
            'description' => ['nullable', 'string'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'distinct', 'exists:categories,id'],
        ];
    }
}
