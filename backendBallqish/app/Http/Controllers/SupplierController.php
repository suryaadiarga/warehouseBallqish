<?php

namespace App\Http\Controllers;

use App\Models\Supplier;

class SupplierController extends Controller
{
    public function index()
    {
        return $this->successResponse(
            Supplier::query()->select(['id', 'name', 'contact'])->withCount('products')->orderBy('name')->get(),
            'Data supplier berhasil diambil'
        );
    }
}
