<?php

namespace App\Services;

use App\Models\StockMutation;
use Illuminate\Support\Facades\DB;
use Exception;

class StockMutationService
{
    public function createDraft(array $data, int $userId)
    {
        $data['user_id'] = $userId;
        $data['status'] = 'draft';
        
        return StockMutation::create($data);
    }

    public function approveMutation(int $id, string $userRole)
    {
        $allowedRoles = ['admin_gudang', 'superadmin', 'super_admin'];
        
        if (!in_array($userRole, $allowedRoles)) {
            throw new Exception('Hanya Admin Gudang atau Super Admin yang memiliki otoritas.', 403);
        }

        return DB::transaction(function () use ($id) {
            $mutation = StockMutation::with('product')->findOrFail($id);
            
            if ($mutation->status === 'approved') {
                throw new Exception('Transaksi ini sudah disetujui sebelumnya.', 400);
            }

            $product = $mutation->product;

            if ($mutation->type === 'in') {
                $product->increment('stock', $mutation->quantity);
            } else {
                if ($product->stock < $mutation->quantity) {
                    throw new Exception("Stok tidak mencukupi! Sisa stok: " . $product->stock, 400);
                }
                $product->decrement('stock', $mutation->quantity);
            }

            $mutation->update(['status' => 'approved']);

            return $mutation;
        });
    }
}