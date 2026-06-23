<?php

namespace App\Services;

class ProductImageResolver
{
    public function resolve(string $productName, string $sku = ''): string
    {
        foreach (config('product_images.types', []) as $productType => $imageKeys) {
            if (str_starts_with(mb_strtolower($productName), mb_strtolower($productType))) {
                $keys = array_values($imageKeys);
                $hashSource = $sku !== '' ? $sku : $productName;
                $index = abs(crc32($hashSource)) % count($keys);

                return $keys[$index];
            }
        }

        return config('product_images.default', 'default-product');
    }
}
