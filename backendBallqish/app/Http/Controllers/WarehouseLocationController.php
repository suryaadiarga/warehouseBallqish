<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWarehouseLocationRequest;
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
}
