<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockTransferRequest;
use App\Services\StockMutationService;
use Exception;

class StockTransferController extends Controller
{
    public function __construct(private readonly StockMutationService $mutationService)
    {
    }

    public function store(StoreStockTransferRequest $request)
    {
        try {
            $transfer = $this->mutationService->createTransfer(
                $request->validated(),
                $request->user()->id,
                $request->user()->role
            );

            return $this->successResponse($transfer, 'Transfer stok berhasil dibuat');
        } catch (Exception $e) {
            $status = is_int($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;

            return $this->errorResponse($e->getMessage(), $status);
        }
    }
}
