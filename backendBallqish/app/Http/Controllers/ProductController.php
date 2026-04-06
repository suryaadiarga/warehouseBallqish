<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->select(['id', 'category_id', 'sku', 'barcode', 'name', 'stock', 'min_stock_level'])
            ->with(['category:id,name']);

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->category_id);
        }

        if ($request->filled('search')) {
            $search = (string) $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 25);
        $perPage = max(1, min($perPage, 100));

        $products = $query->latest()->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $products->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ]
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'sku' => 'required|unique:products,sku',
            'barcode' => 'nullable|unique:products,barcode',
            'name' => 'required|string',
            'min_stock_level' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
        ]);
        
        $validated['stock'] = 0; // Stok awal wajib 0, harus lewat mutasi IN
        Product::create($validated);
        
        return response()->json(['status' => 'success', 'message' => 'Produk berhasil ditambahkan']);
    }

    public function destroy($id)
    {
        Product::destroy($id);
        return response()->json(['status' => 'success', 'message' => 'Produk dihapus']);
    }
}