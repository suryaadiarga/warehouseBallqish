<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\InventoryAnalyticsService;
use Illuminate\Http\Request;

class StockAlertController extends Controller
{
    public function __construct(private readonly InventoryAnalyticsService $analyticsService)
    {
    }

    public function index(Request $request)
    {
        $warehouseId = $request->filled('warehouse_id') ? $request->integer('warehouse_id') : null;
        $query = Product::query()
            ->select(['id', 'category_id', 'sku', 'name', 'stock', 'min_stock_level'])
            ->with([
                'category:id,name',
                'productStocks.warehouse:id,name',
                'productStocks.warehouseLocation:id,warehouse_id,code,name',
            ]);

        if ($warehouseId) {
            $query->whereHas('productStocks', fn ($stockQuery) => $stockQuery->where('warehouse_id', $warehouseId));
        }

        $products = $query->orderBy('stock')->get();

        $alerts = $products
            ->map(fn (Product $product) => $this->analyticsService->buildProductAnalysis($product, $warehouseId))
            ->filter(fn (array $alert) => $alert['status'] !== 'safe')
            ->values();

        return $this->successResponse($alerts, 'Data alert stok berhasil diambil');
    }
}
