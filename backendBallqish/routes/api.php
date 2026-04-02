<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockMutationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\CategoryController;
// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Dashboard
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/update-password', [AuthController::class, 'updatePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Master Data Kategori (Sudah Rapi)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Master Data Produk (Sudah Rapi)
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    
    // Transactions
    Route::post('/mutations', [StockMutationController::class, 'store']);
    Route::put('/mutations/{id}/approve', [StockMutationController::class, 'approve']);
    Route::delete('/mutations/{id}/reject', [StockMutationController::class, 'reject']);

    // Reports
    Route::get('/reports/mutations', [ReportController::class, 'mutationHistory']);
});