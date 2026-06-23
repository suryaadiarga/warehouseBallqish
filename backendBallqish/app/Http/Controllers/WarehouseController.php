<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWarehouseRequest;
use App\Models\ProductStock;
use App\Models\StockMutation;
use App\Models\Warehouse;

class WarehouseController extends Controller
{
    public function index()
    {
        $warehouses = Warehouse::query()
            ->select(['id', 'name', 'location', 'created_at'])
            ->withCount('locations as rack_count')
            ->withCount('productStocks as stock_rows_count')
            ->withSum('productStocks as total_quantity', 'quantity')
            ->latest()
            ->get();

        return $this->successResponse($warehouses, 'Data gudang berhasil diambil');
    }

    public function store(StoreWarehouseRequest $request)
    {
        $warehouse = Warehouse::create($request->validated());

        return $this->successResponse($warehouse, 'Gudang berhasil ditambahkan', 201);
    }

    public function update(StoreWarehouseRequest $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);
        $warehouse->update($request->validated());

        return $this->successResponse($warehouse, 'Gudang berhasil diperbarui');
    }

    public function destroy($id)
    {
        $warehouse = Warehouse::findOrFail($id);

        $used = $warehouse->locations()->exists()
            || ProductStock::where('warehouse_id', $warehouse->id)->exists()
            || StockMutation::where('warehouse_id', $warehouse->id)
                ->orWhere('from_warehouse_id', $warehouse->id)
                ->orWhere('to_warehouse_id', $warehouse->id)
                ->exists();

        if ($used) {
            return $this->errorResponse(
                'Gudang tidak dapat dihapus karena masih memiliki lokasi, stok, transaksi, atau audit stok terkait.',
                409
            );
        }

        $warehouse->delete();

        return $this->successResponse(null, 'Gudang berhasil dihapus');
    }

    public function show($id)
    {
        $warehouse = Warehouse::query()
            ->select(['id', 'name', 'location', 'created_at'])
            ->withCount('locations as rack_count')
            ->withCount('productStocks as stock_rows_count')
            ->withSum('productStocks as total_quantity', 'quantity')
            ->with([
                'locations' => fn ($query) => $query
                    ->with('categories:id,name')
                    ->withCount('productStocks as sku_count')
                    ->withSum('productStocks as total_quantity', 'quantity')
                    ->orderBy('code'),
            ])
            ->findOrFail($id);

        return $this->successResponse($warehouse, 'Detail gudang berhasil diambil');
    }
}
