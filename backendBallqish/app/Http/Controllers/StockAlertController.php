<?php

namespace App\Http\Controllers;

use App\Services\InventoryAnalyticsService;
use Illuminate\Http\Request;

class StockAlertController extends Controller
{
    public function __construct(private readonly InventoryAnalyticsService $analyticsService) {}

    public function index(Request $request)
    {
        $warehouseId = $request->filled('warehouse_id') ? $request->integer('warehouse_id') : null;
        $alerts = $this->analyticsService
            ->buildMovementAnalysis($warehouseId)
            ->filter(fn (array $alert) => $alert['status'] !== 'safe' || $alert['movement_status'] === 'dead_stock')
            ->sortByDesc('critical_score')
            ->values();

        return $this->successResponse($alerts, 'Data alert stok berhasil diambil');
    }
}
