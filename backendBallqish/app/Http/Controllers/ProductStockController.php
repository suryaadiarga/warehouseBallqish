<?php

namespace App\Http\Controllers;

use App\Models\ProductStock;
use Illuminate\Http\Request;

class ProductStockController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductStock::query()
            ->with([
                'product:id,name,sku,image_key,stock,min_stock_level',
                'warehouse:id,name,location',
                'warehouseLocation:id,warehouse_id,code,name',
            ]);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->integer('warehouse_id'));
        }

        $stocks = $query
            ->orderByDesc('quantity')
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return $this->successResponse(
            $stocks->items(),
            'Data stok per gudang berhasil diambil',
            200,
            [
                'pagination' => [
                    'current_page' => $stocks->currentPage(),
                    'last_page' => $stocks->lastPage(),
                    'per_page' => $stocks->perPage(),
                    'total' => $stocks->total(),
                ],
            ]
        );
    }
}
