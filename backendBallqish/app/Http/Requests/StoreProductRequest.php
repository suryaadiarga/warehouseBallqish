<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'sku' => ['required', 'string', 'max:255', Rule::unique('products', 'sku')->ignore($this->route('id'))],
            'name' => ['required', 'string', 'max:255'],
            'min_stock_level' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
        ];
    }
}
