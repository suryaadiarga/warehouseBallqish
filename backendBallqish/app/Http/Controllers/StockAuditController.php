<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockAuditRequest;
use App\Models\StockAudit;
use App\Services\StockAuditService;
use Exception;
use Illuminate\Http\Request;

class StockAuditController extends Controller
{
    public function __construct(private readonly StockAuditService $auditService) {}

    public function index(Request $request)
    {
        $audits = StockAudit::query()
            ->with(['warehouse:id,name', 'warehouseLocation:id,warehouse_id,code,name', 'user:id,name', 'completer:id,name', 'items.product:id,name,sku'])
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->latest()->limit(50)->get();

        return $this->successResponse($audits);
    }

    public function store(StoreStockAuditRequest $request)
    {
        try {
            return $this->successResponse($this->auditService->create($request->validated(), $request->user()->id), 'Audit Stok dibuat dari snapshot rak.', 201);
        } catch (Exception $e) {
            return $this->automationError($e);
        }
    }

    public function count(int $id, Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'distinct', 'exists:products,id'],
            'items.*.physical_qty' => ['required', 'integer', 'min:0'],
        ]);
        try {
            return $this->successResponse($this->auditService->recordCounts($id, $data['items']), 'Hasil hitung fisik disimpan.');
        } catch (Exception $e) {
            return $this->automationError($e);
        }
    }

    public function complete(int $id, Request $request)
    {
        if (! in_array($request->user()->role, ['admin_gudang', 'superadmin', 'super_admin'], true)) {
            return $this->errorResponse('Hanya admin yang dapat menyelesaikan Audit Stok.', 403);
        }
        try {
            return $this->successResponse($this->auditService->complete($id, $request->user()->id), 'Audit selesai dan mutasi rekonsiliasi dibuat otomatis.');
        } catch (Exception $e) {
            return $this->automationError($e);
        }
    }

    private function automationError(Exception $e)
    {
        $status = is_int($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 422;

        return $this->errorResponse($e->getMessage(), $status);
    }
}
