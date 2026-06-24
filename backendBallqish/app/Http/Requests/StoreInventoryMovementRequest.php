<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\WarehouseLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInventoryMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['in', 'out'])],
            'supplier_id' => ['required_if:type,in', 'nullable', 'exists:suppliers,id'],
            'product_id' => ['required', 'exists:products,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'warehouse_location_id' => ['nullable', 'exists:warehouse_locations,id'],
            'destination_type' => ['required_if:type,out', 'nullable', Rule::in(['customer', 'transit'])],
            'to_warehouse_id' => ['required_if:destination_type,transit', 'nullable', 'exists:warehouses,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $warehouseId = $this->input('warehouse_id');
            $locationId = $this->input('warehouse_location_id');
            $productId = $this->input('product_id');
            $supplierId = $this->input('supplier_id');

            if ($locationId && ! $warehouseId) {
                $validator->errors()->add('warehouse_id', 'Gudang wajib dipilih jika rak dipilih manual.');
            }

            if ($warehouseId && $locationId) {
                $exists = WarehouseLocation::query()
                    ->whereKey($locationId)
                    ->where('warehouse_id', $warehouseId)
                    ->exists();

                if (! $exists) {
                    $validator->errors()->add('warehouse_location_id', 'Rak tidak sesuai dengan gudang yang dipilih.');
                }
            }

            if ($this->input('type') === 'in' && $productId && $supplierId) {
                $matchesSupplier = Product::query()
                    ->whereKey($productId)
                    ->where('supplier_id', $supplierId)
                    ->exists();

                if (! $matchesSupplier) {
                    $validator->errors()->add('product_id', 'Produk tidak terdaftar pada supplier yang dipilih.');
                }
            }

            if (
                $this->input('type') === 'out'
                && $this->input('destination_type') === 'transit'
                && $warehouseId
                && (int) $warehouseId === (int) $this->input('to_warehouse_id')
            ) {
                $validator->errors()->add('to_warehouse_id', 'Gudang transit harus berbeda dari gudang asal.');
            }
        });
    }
}
