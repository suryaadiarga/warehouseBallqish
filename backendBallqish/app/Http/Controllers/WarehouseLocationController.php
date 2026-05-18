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
            ->select(['id', 'warehouse_id', 'code', 'name', 'description', 'created_at'])
            ->with(['warehouse:id,name']);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->integer('warehouse_id'));
        }

        $locations = $query->latest()->get();

        return $this->successResponse($locations, 'Data lokasi gudang berhasil diambil');
    }

    public function store(StoreWarehouseLocationRequest $request)
    {
        $location = WarehouseLocation::create($request->validated())->load('warehouse:id,name');

        return $this->successResponse($location, 'Lokasi gudang berhasil ditambahkan', 201);
    }

    public function update(StoreWarehouseLocationRequest $request, $id)
    {
        $location = WarehouseLocation::findOrFail($id);
        $location->update($request->validated());

        return $this->successResponse(
            $location->fresh('warehouse:id,name'),
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
