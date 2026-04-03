<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\StockMutation;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_products' => Product::count(),
                'low_stock_alerts' => Product::query()
                    ->select(['id', 'name', 'sku', 'stock', 'min_stock_level'])
                    ->whereColumn('stock', '<=', 'min_stock_level')
                    ->orderBy('stock')
                    ->limit(20)
                    ->get(),
                // Hanya hitung yang sudah disetujui (Approved)
                'total_inbound_today' => StockMutation::where('type', 'in')
                    ->where('status', 'approved')
                    ->whereDate('created_at', today())
                    ->sum('quantity'),
                'total_outbound_today' => StockMutation::where('type', 'out')
                    ->where('status', 'approved')
                    ->whereDate('created_at', today())
                    ->sum('quantity'),
                // Tambahan: Aktivitas mutasi terbaru untuk tabel di dashboard
                'recent_activities' => StockMutation::with('product')
                    ->latest()
                    ->take(5)
                    ->get()
            ]
        ]);
    }
}