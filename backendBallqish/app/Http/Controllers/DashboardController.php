<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMutation;
use App\Services\InventoryAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function __construct(private readonly InventoryAnalyticsService $analyticsService) {}

    public function index()
    {
        $data = [
            'total_products' => Product::count(),
            'low_stock_alerts' => Product::query()
                ->select(['id', 'name', 'sku', 'image_key', 'stock', 'min_stock_level'])
                ->whereColumn('stock', '<=', 'min_stock_level')
                ->orderBy('stock')
                ->limit(20)
                ->get(),
            'total_inbound_today' => StockMutation::where('type', 'in')
                ->where('status', 'approved')
                ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
                ->sum('quantity'),
            'total_outbound_today' => StockMutation::where('type', 'out')
                ->where('status', 'approved')
                ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
                ->sum('quantity'),
            'recent_activities' => StockMutation::with('product:id,name,sku,image_key')
                ->latest()
                ->take(5)
                ->get(),
        ];

        return $this->successResponse($data, 'Ringkasan dashboard berhasil diambil');
    }

    public function insights(Request $request)
    {
        $warehouseId = $request->filled('warehouse_id') ? $request->integer('warehouse_id') : null;
        $cacheKey = 'dashboard:insights:v3:warehouse:'.($warehouseId ?? 'all').':days:90';
        $insights = Cache::remember(
            $cacheKey,
            now()->addSeconds(60),
            fn () => $this->analyticsService->buildDashboardInsights($warehouseId)
        );

        return $this->successResponse(
            $insights,
            'Insight dashboard berhasil diambil',
            200,
            [
                'warehouse_id' => $warehouseId,
                'lookback_days' => 90,
            ]
        );
    }
}
