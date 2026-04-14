<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockMutationRequest;
use App\Models\StockMutation;
use App\Services\StockMutationService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class StockMutationController extends Controller
{
    protected $mutationService;

    public function __construct(StockMutationService $mutationService)
    {
        $this->mutationService = $mutationService;
    }

    public function store(StoreStockMutationRequest $request)
    {
        $mutation = $this->mutationService
            ->createDraft($request->validated(), $request->user()->id)
            ->load(['product:id,name,sku', 'warehouse:id,name', 'warehouseLocation:id,warehouse_id,code,name']);

        return $this->successResponse($mutation, 'Draft mutasi berhasil dibuat', 201);
    }

    public function approve($id, Request $request)
    {
        try {
            $mutation = $this->mutationService->approveMutation($id, $request->user()->role, $request->user()->id);

            return $this->successResponse($mutation, 'Mutasi berhasil disetujui');
        } catch (ModelNotFoundException $e) {
            return $this->errorResponse('Data mutasi tidak ditemukan.', 404);
        } catch (Exception $e) {
            $status = $e->getCode();
            $status = is_int($status) && $status >= 400 && $status < 600 ? $status : 400;

            return $this->errorResponse($e->getMessage(), $status);
        }
    }

    public function reject($id, Request $request)
    {
        $mutation = StockMutation::findOrFail($id);
        
        $allowedRoles = ['admin_gudang', 'superadmin', 'super_admin'];
        if (!in_array($request->user()->role, $allowedRoles)) {
            return $this->errorResponse('Hanya admin yang bisa menolak mutasi.', 403);
        }

        if ($mutation->status === 'approved') {
            return $this->errorResponse('Tidak bisa menolak mutasi yang sudah disetujui sebelumnya.', 400);
        }

        $mutation->delete();

        return $this->successResponse(null, 'Mutasi ditolak dan dihapus dari sistem.');
    }
}
