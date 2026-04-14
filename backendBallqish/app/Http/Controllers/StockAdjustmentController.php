<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockAdjustmentRequest;
use App\Services\StockMutationService;
use Exception;

class StockAdjustmentController extends Controller
{
    public function __construct(private readonly StockMutationService $mutationService)
    {
    }

    public function store(StoreStockAdjustmentRequest $request)
    {
        try {
            $adjustment = $this->mutationService->createAdjustment(
                $request->validated(),
                $request->user()->id,
                $request->user()->role
            );

            return $this->successResponse($adjustment, 'Adjustment stok berhasil diproses');
        } catch (Exception $e) {
            $status = is_int($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;

            return $this->errorResponse($e->getMessage(), $status);
        }
    }
}
