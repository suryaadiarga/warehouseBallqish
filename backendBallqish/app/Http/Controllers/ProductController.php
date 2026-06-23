<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use App\Models\StockMutation;
use App\Services\ProductImageResolver;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->select(['id', 'category_id', 'supplier_id', 'sku', 'name', 'image_key', 'stock', 'min_stock_level', 'lead_time_days', 'safety_stock', 'price'])
            ->with(['category:id,name', 'supplier:id,name']);

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->category_id);
        }

        if ($request->filled('search')) {
            $search = (string) $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 25);
        $perPage = max(1, min($perPage, 1000));

        $products = $query->latest()->paginate($perPage);

        return $this->successResponse(
            $products->items(),
            'Data produk berhasil diambil',
            200,
            [
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
            ]
        );
    }

    public function store(StoreProductRequest $request)
    {
        $validated = $request->validated();
        $validated['stock'] = 0; // Stok awal wajib 0, harus lewat mutasi IN
        $validated['image_key'] = app(ProductImageResolver::class)->resolve($validated['name'], $validated['sku']);

        $product = Product::create($validated);

        return $this->successResponse($product, 'Produk berhasil ditambahkan', 201);
    }

    public function update(StoreProductRequest $request, $id)
    {
        $product = Product::findOrFail($id);
        $validated = $request->validated();
        $validated['image_key'] = app(ProductImageResolver::class)->resolve($validated['name'], $validated['sku']);
        $product->update($validated);

        return $this->successResponse(
            $product->fresh(['category:id,name', 'supplier:id,name']),
            'Produk berhasil diperbarui'
        );
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return $this->successResponse(null, 'Produk berhasil dihapus');
    }

    public function stocks($id)
    {
        $product = Product::query()
            ->select(['id', 'name', 'sku', 'image_key', 'stock', 'min_stock_level'])
            ->with([
                'productStocks' => fn ($query) => $query
                    ->with([
                        'warehouse:id,name,location',
                        'warehouseLocation:id,warehouse_id,code,name',
                    ])
                    ->orderByDesc('quantity'),
            ])
            ->findOrFail($id);

        return $this->successResponse([
            'product' => $product->only(['id', 'name', 'sku', 'image_key', 'image_url', 'image_is_illustration', 'stock', 'min_stock_level']),
            'stocks' => $product->productStocks,
        ], 'Detail stok produk berhasil diambil');
    }

    public function stockCard($id, Request $request)
    {
        $product = Product::query()
            ->select(['id', 'name', 'sku', 'image_key', 'stock', 'min_stock_level'])
            ->findOrFail($id);

        $query = StockMutation::query()
            ->with([
                'warehouse:id,name',
                'warehouseLocation:id,warehouse_id,code,name',
                'fromWarehouse:id,name',
                'toWarehouse:id,name',
                'user:id,name',
                'approver:id,name',
            ])
            ->where('product_id', $product->id);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->integer('warehouse_id'));
        }

        $mutations = $query
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->map(function (StockMutation $mutation) {
                $changeQty = $mutation->type === 'in' ? $mutation->quantity : -$mutation->quantity;

                return [
                    'id' => $mutation->id,
                    'reference_number' => $mutation->reference_number,
                    'transfer_id' => $mutation->transfer_id,
                    'mutation_source' => $mutation->mutation_source,
                    'type' => $mutation->type,
                    'status' => $mutation->status,
                    'reason' => $mutation->reason,
                    'note' => $mutation->note,
                    'before_qty' => $mutation->before_qty,
                    'change_qty' => $changeQty,
                    'after_qty' => $mutation->after_qty,
                    'warehouse' => $mutation->warehouse?->only(['id', 'name']),
                    'warehouse_location' => $mutation->warehouseLocation?->only(['id', 'code', 'name']),
                    'from_warehouse' => $mutation->fromWarehouse?->only(['id', 'name']),
                    'to_warehouse' => $mutation->toWarehouse?->only(['id', 'name']),
                    'created_by' => $mutation->user?->only(['id', 'name']),
                    'approved_by' => $mutation->approver?->only(['id', 'name']),
                    'created_at' => optional($mutation->created_at)->toDateTimeString(),
                ];
            });

        return $this->successResponse([
            'product' => $product,
            'stock_card' => $mutations,
        ], 'Kartu stok produk berhasil diambil');
    }
}
