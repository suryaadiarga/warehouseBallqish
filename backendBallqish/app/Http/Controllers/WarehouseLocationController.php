<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWarehouseLocationRequest;
use App\Models\ProductStock;
use App\Models\StockMutation;
use App\Models\WarehouseLocation;
use Illuminate\Http\Request;

class WarehouseLocationController extends Controller
{
    public function index(Request $request)
    {
        $query = WarehouseLocation::query()
            ->select([
                'id',
                'warehouse_id',
                'code',
                'name',
                'zone',
                'aisle',
                'level',
                'capacity',
                'status',
                'description',
                'created_at',
            ])
            ->with(['warehouse:id,name', 'categories:id,name'])
            ->withCount('productStocks as sku_count')
            ->withSum('productStocks as total_quantity', 'quantity');

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->integer('warehouse_id'));
        }

        $locations = $query->latest()->get();

        return $this->successResponse($locations, 'Data lokasi gudang berhasil diambil');
    }

    public function store(StoreWarehouseLocationRequest $request)
    {
        $validated = $request->validated();
        $categoryIds = $validated['category_ids'] ?? [];
        unset($validated['category_ids']);

        $location = WarehouseLocation::create($validated);
        $location->categories()->sync($categoryIds);
        $location->load(['warehouse:id,name', 'categories:id,name']);
        $location->loadCount('productStocks as sku_count');
        $location->loadSum('productStocks as total_quantity', 'quantity');

        return $this->successResponse($location, 'Lokasi gudang berhasil ditambahkan', 201);
    }

    public function update(StoreWarehouseLocationRequest $request, $id)
    {
        $location = WarehouseLocation::findOrFail($id);
        $validated = $request->validated();
        $categoryIds = $validated['category_ids'] ?? [];
        unset($validated['category_ids']);

        $location->update($validated);
        $location->categories()->sync($categoryIds);

        $location = $location->fresh(['warehouse:id,name', 'categories:id,name']);
        $location->loadCount('productStocks as sku_count');
        $location->loadSum('productStocks as total_quantity', 'quantity');

        return $this->successResponse(
            $location,
            'Lokasi gudang berhasil diperbarui'
        );
    }

    public function destroy($id)
    {
        $location = WarehouseLocation::findOrFail($id);

        $used = ProductStock::where('warehouse_location_id', $location->id)->exists()
            || StockMutation::where('warehouse_location_id', $location->id)->exists();

        if ($used) {
            return $this->errorResponse(
                'Lokasi gudang tidak dapat dihapus karena masih digunakan oleh stok atau transaksi.',
                409
            );
        }

        $location->delete();

        return $this->successResponse(null, 'Lokasi gudang berhasil dihapus');
    }
}
