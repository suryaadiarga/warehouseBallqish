<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStockTransferStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                'approved', 'in_transit', 'arrived', 'completed',
                'rejected', 'cancelled', 'discrepancy',
            ])],
            'received_quantity' => [
                Rule::requiredIf(fn () => in_array($this->input('status'), ['completed', 'discrepancy'], true)),
                'nullable',
                'integer',
                'min:0',
            ],
            'note' => [
                Rule::requiredIf(fn () => in_array($this->input('status'), ['rejected', 'cancelled', 'discrepancy'], true)),
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}
