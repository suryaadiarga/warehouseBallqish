<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductAnalyticsController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductStockController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockAlertController;
use App\Http\Controllers\StockAuditController;
use App\Http\Controllers\StockMutationController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\WarehouseLocationController;
use Illuminate\Support\Facades\Route;

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
    Route::get('/dashboard/insights', [DashboardController::class, 'insights']);

    // Master Data Kategori (Sudah Rapi)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Master Data Gudang
    Route::get('/warehouses', [WarehouseController::class, 'index']);
    Route::post('/warehouses', [WarehouseController::class, 'store']);
    Route::get('/warehouses/{id}', [WarehouseController::class, 'show']);
    Route::put('/warehouses/{id}', [WarehouseController::class, 'update']);
    Route::delete('/warehouses/{id}', [WarehouseController::class, 'destroy']);

    // Lokasi Detail Gudang
    Route::get('/warehouse-locations', [WarehouseLocationController::class, 'index']);
    Route::post('/warehouse-locations', [WarehouseLocationController::class, 'store']);
    Route::put('/warehouse-locations/{id}', [WarehouseLocationController::class, 'update']);
    Route::delete('/warehouse-locations/{id}', [WarehouseLocationController::class, 'destroy']);

    Route::get('/suppliers', [SupplierController::class, 'index']);

    // Master Data Produk (Sudah Rapi)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/movement-analysis', [ProductAnalyticsController::class, 'movementAnalysis']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{id}/stocks', [ProductController::class, 'stocks']);
    Route::get('/products/{id}/stock-card', [ProductController::class, 'stockCard']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Stok per Gudang
    Route::get('/product-stocks', [ProductStockController::class, 'index']);
    Route::get('/stock-alerts', [StockAlertController::class, 'index']);

    // Transactions
    Route::post('/mutations', [StockMutationController::class, 'store']);
    Route::put('/mutations/{id}/approve', [StockMutationController::class, 'approve']);
    Route::delete('/mutations/{id}/reject', [StockMutationController::class, 'reject']);
    Route::post('/stock-transfers', [StockTransferController::class, 'store']);
    Route::post('/stock-adjustments', [StockAdjustmentController::class, 'store']);

    // Audit Stok per rak
    Route::get('/stock-audits', [StockAuditController::class, 'index']);
    Route::post('/stock-audits', [StockAuditController::class, 'store']);
    Route::put('/stock-audits/{id}/counts', [StockAuditController::class, 'count']);
    Route::put('/stock-audits/{id}/complete', [StockAuditController::class, 'complete']);

    // Reports
    Route::get('/reports/mutations', [ReportController::class, 'mutationHistory']);
});
