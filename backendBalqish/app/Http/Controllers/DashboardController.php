<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
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
                'low_stock_alerts' => Product::where('stock', '<', 10)->get(), // Alert stok menipis
                'total_inbound_today' => StockMutation::where('type', 'in')
                                        ->whereDate('created_at', today())
                                        ->sum('quantity'),
                'total_outbound_today' => StockMutation::where('type', 'out')
                                         ->whereDate('created_at', today())
                                         ->sum('quantity'),
            ]
        ]);
    }
}
