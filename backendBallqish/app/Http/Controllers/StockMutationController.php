<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StockMutation;
use Exception;
use Illuminate\Support\Facades\Auth;

class StockMutationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string'
        ]);

        // Audit Trail: Mencatat user_id yang membuat draft (Staff/Admin)
        $mutation = StockMutation::create([
            'user_id' => Auth::id(), 
            'product_id' => $request->product_id,
            'type' => $request->type,
            'quantity' => $request->quantity,
            'note' => $request->note,
            'status' => 'draft'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dibuat (Status: Draft)',
            'data' => $mutation->load('product') // Load data produk
        ]);
    }

    public function approve($id)
    {
        try {
            // Proteksi Role: Hanya admin_gudang yang boleh approve
            if (Auth::user()->role !== 'admin_gudang') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Admin Gudang yang memiliki otoritas untuk menyetujui transaksi.'
                ], 403);
            }

            $mutation = StockMutation::findOrFail($id);
            
            $mutation->approve();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi disetujui, stok produk telah diperbarui.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}