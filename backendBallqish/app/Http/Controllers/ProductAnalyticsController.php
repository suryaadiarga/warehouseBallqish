<?php

namespace App\Http\Controllers;

use App\Services\InventoryAnalyticsService;
use Illuminate\Http\Request;

class ProductAnalyticsController extends Controller
{
    public function __construct(private readonly InventoryAnalyticsService $analyticsService) {}

    public function movementAnalysis(Request $request)
    {
        $warehouseId = $request->filled('warehouse_id') ? $request->integer('warehouse_id') : null;
        $analysis = $this->analyticsService->buildMovementAnalysis($warehouseId);

        return $this->successResponse(
            $analysis->all(),
            'Analisis pergerakan produk berhasil diambil',
            200,
            [
                'warehouse_id' => $warehouseId,
                'lookback_days' => 90,
            ]
        );
    }
}
