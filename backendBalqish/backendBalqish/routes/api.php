<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockMutationController;
use App\Models\Product;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

//dashboard
Route::get('/dashboard', [DashboardController::class, 'index']);
//master produk
Route::apiResource('products', ProductController::class);

//transaksi gudang
Route::post('/mutations', [StockMutationController::class, 'store']);
Route::put('/mutations/{id}/approve', [StockMutationController::class, 'approve']);