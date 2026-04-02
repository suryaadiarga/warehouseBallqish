<?php

namespace App\Http\Controllers;

use App\Models\StockMutation;
use App\Services\StockMutationService;
use Illuminate\Http\Request;

class StockMutationController extends Controller
{
    protected $mutationService;

    public function __construct(StockMutationService $mutationService)
    {
        $this->mutationService = $mutationService;
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string'
        ]);

        $mutation = $this->mutationService->createDraft($request->all(), $request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Draft mutasi berhasil dibuat',
            'data' => $mutation
        ]);
    }

    public function approve($id, Request $request)
    {
        $mutation = $this->mutationService->approveMutation($id, $request->user()->role);
        
        $mutation->update(['approved_by' => $request->user()->id]);

        return response()->json([
            'status' => 'success',
            'message' => 'Mutasi berhasil disetujui',
            'data' => $mutation
        ]);
    }

    public function reject($id, Request $request)
    {
        $mutation = StockMutation::findOrFail($id);
        
        $allowedRoles = ['admin_gudang', 'superadmin', 'super_admin'];
        if (!in_array($request->user()->role, $allowedRoles)) {
            return response()->json(['message' => 'Hanya Admin yang bisa menolak mutasi.'], 403);
        }

        if ($mutation->status === 'approved') {
            return response()->json(['message' => 'Tidak bisa menolak mutasi yang sudah disetujui sebelumnya.'], 400);
        }

        $mutation->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Mutasi ditolak dan dihapus dari sistem.'
        ]);
    }
}