<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWarehouseRequest;
use App\Models\Warehouse;

class WarehouseController extends Controller
{
    public function index()
    {
        $warehouses = Warehouse::query()
            ->select(['id', 'name', 'location', 'latitude', 'longitude', 'created_at'])
            ->latest()
            ->get();

        return $this->successResponse($warehouses, 'Data gudang berhasil diambil');
    }

    public function store(StoreWarehouseRequest $request)
    {
        $warehouse = Warehouse::create($request->validated());

        return $this->successResponse($warehouse, 'Gudang berhasil ditambahkan', 201);
    }

    public function map()
    {
        $warehouses = Warehouse::query()
            ->select(['id', 'name', 'latitude', 'longitude'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        return $this->successResponse($warehouses, 'Data lokasi gudang berhasil diambil');
    }
}
