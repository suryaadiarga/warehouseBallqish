<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockTransferRequest;
use App\Http\Requests\UpdateStockTransferStatusRequest;
use App\Models\StockTransfer;
use App\Services\StockMutationService;
use Exception;
use Illuminate\Http\Request;

class StockTransferController extends Controller
{
    public function __construct(private readonly StockMutationService $mutationService) {}

    public function store(StoreStockTransferRequest $request)
    {
        try {
            $transfer = $this->mutationService->createTransfer(
                $request->validated(),
                $request->user()->id,
                $request->user()->role
            );

            return $this->successResponse($transfer, 'Transfer stok dibuat dan menunggu persetujuan', 201);
        } catch (Exception $e) {
            $status = is_int($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;

            return $this->errorResponse($e->getMessage(), $status);
        }
    }

    public function index(Request $request)
    {
        $status = $request->filled('status') ? $request->string('status')->toString() : null;

        return $this->successResponse(
            $this->mutationService->listTransfers($status),
            'Data transfer stok berhasil diambil'
        );
    }

    public function show(StockTransfer $stockTransfer)
    {
        return $this->successResponse(
            $this->mutationService->loadTransfer($stockTransfer),
            'Detail transfer stok berhasil diambil'
        );
    }

    public function updateStatus(
        UpdateStockTransferStatusRequest $request,
        StockTransfer $stockTransfer
    ) {
        try {
            $transfer = $this->mutationService->updateTransferStatus(
                $stockTransfer,
                $request->validated('status'),
                $request->validated(),
                $request->user()->id,
                $request->user()->role
            );

            return $this->successResponse($transfer, 'Status transfer berhasil diperbarui');
        } catch (Exception $e) {
            $status = is_int($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;

            return $this->errorResponse($e->getMessage(), $status);
        }
    }
}
