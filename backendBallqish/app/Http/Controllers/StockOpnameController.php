<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockOpnameRequest;
use App\Models\StockOpname;
use App\Services\StockMutationService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class StockOpnameController extends Controller
{
    public function __construct(private readonly StockMutationService $mutationService)
    {
    }

    public function index()
    {
        $stockOpnames = StockOpname::query()
            ->with(['warehouse:id,name', 'user:id,name', 'items.product:id,name,sku'])
            ->latest()
            ->get();

        return $this->successResponse($stockOpnames, 'Data stock opname berhasil diambil');
    }

    public function store(StoreStockOpnameRequest $request)
    {
        $stockOpname = $this->mutationService->createStockOpname($request->validated(), $request->user()->id);

        return $this->successResponse($stockOpname, 'Draft stock opname berhasil dibuat', 201);
    }

    public function complete($id)
    {
        try {
            $completed = $this->mutationService->completeStockOpname(
                (int) $id,
                request()->user()->id,
                request()->user()->role
            );

            return $this->successResponse($completed, 'Stock opname berhasil diselesaikan');
        } catch (ModelNotFoundException $e) {
            return $this->errorResponse('Data stock opname tidak ditemukan.', 404);
        } catch (Exception $e) {
            $status = is_int($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;

            return $this->errorResponse($e->getMessage(), $status);
        }
    }
}
