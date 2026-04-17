<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Models\Category;
use Illuminate\Database\QueryException;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::query()
            ->select(['id', 'name'])
            ->latest()
            ->get();

        return $this->successResponse($categories, 'Data kategori berhasil diambil');
    }

    public function store(StoreCategoryRequest $request)
    {
        Category::create($request->validated());

        return $this->successResponse(null, 'Kategori berhasil ditambahkan', 201);
    }

    public function destroy($id)
    {
        try {
            $category = Category::findOrFail($id);
            $category->delete();

            return $this->successResponse(null, 'Kategori berhasil dihapus');
        } catch (QueryException $e) {
            return $this->errorResponse('Gagal menghapus. Kategori ini masih digunakan oleh produk.', 400);
        }
    }
}
