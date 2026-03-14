<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StockMutation;

class StockMutationController extends Controller
{
    public function store(Request $request) {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
        ]);

        $mutation = StockMutation::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dibuat (Status: Draft)',
            'data' => $mutation
        ]);
    }

    public function approve($id) {
        $mutation = StockMutation::findOrFail($id);
        $mutation->approve();

        return response()->json([
            'success' => true,
            'message' => 'Transaksi disetujui, stok produk telah diperbarui.'
        ]);
    }
}