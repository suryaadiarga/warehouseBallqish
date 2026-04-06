<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException; // <-- Tambahkan ini

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => Category::query()
                ->select(['id', 'name'])
                ->latest()
                ->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:categories,name']);
        Category::create(['name' => $request->name]);
        return response()->json(['status' => 'success', 'message' => 'Kategori berhasil ditambahkan']);
    }

    public function destroy($id)
    {
        try {
            Category::destroy($id);
            return response()->json(['status' => 'success', 'message' => 'Kategori dihapus']);
        } catch (QueryException $e) {
            // Menangkap error jika kategori masih dipakai oleh produk
            return response()->json([
                'status' => 'error', 
                'message' => 'Gagal menghapus! Kategori ini sedang digunakan oleh produk di gudang.'
            ], 400);
        }
    }
}