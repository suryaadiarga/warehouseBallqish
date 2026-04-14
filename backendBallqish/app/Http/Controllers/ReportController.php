<?php

namespace App\Http\Controllers;

use App\Models\StockMutation;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function mutationHistory(Request $request)
    {
        $query = StockMutation::with(['product', 'user', 'approver']);

        // filter berdasarkan tanggal
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        $mutations = $query->latest()->paginate(20);

        return $this->successResponse(
            $mutations->items(),
            'Riwayat mutasi berhasil diambil',
            200,
            [
                'total_in' => (clone $query)->where('type', 'in')->sum('quantity'),
                'total_out' => (clone $query)->where('type', 'out')->sum('quantity'),
                'pagination' => [
                    'current_page' => $mutations->currentPage(),
                    'last_page' => $mutations->lastPage(),
                    'per_page' => $mutations->perPage(),
                    'total' => $mutations->total(),
                ],
            ]
        );
    }
}
