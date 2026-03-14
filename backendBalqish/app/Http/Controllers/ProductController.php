<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
{
    $query = Product::with('category');

    // Filter berdasarkan kategori jika ada request dari Next.js
    if ($request->has('category_id')) {
        $query->where('category_id', $request->category_id);
    }

    // Pencarian berdasarkan nama atau SKU (Sesuai naskah )
    if ($request->has('search')) {
        $query->where('name', 'like', '%' . $request->search . '%')
              ->orWhere('sku', 'like', '%' . $request->search . '%');
    }

    return response()->json([
        'success' => true,
        'data' => $query->get()
    ]);
}
}
