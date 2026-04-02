<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%");
        }
        $products = $query->latest()->get(); // Dibuat get() tanpa pagination biar gampang di FE sementara
        
        return response()->json(['status' => 'success', 'data' => $products]);
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