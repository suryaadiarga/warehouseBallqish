<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockMutationController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn() => request()->user());
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::apiResource('products', ProductController::class);
    Route::post('/mutations', [StockMutationController::class, 'store']);
    Route::put('/mutations/{id}/approve', [StockMutationController::class, 'approve']);
    Route::post('/logout', [AuthController::class, 'logout']);
});