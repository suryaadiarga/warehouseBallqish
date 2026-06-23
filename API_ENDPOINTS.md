# API Ballqish Warehouse Management System

## Base URL

Jika backend dijalankan dengan `php artisan serve --port=8080`, base URL API adalah:

```text
http://localhost:8080/api
```

Untuk Android Emulator:

```text
http://10.0.2.2:8080/api
```

Semua endpoint selain login dan register membutuhkan header berikut:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

## Authentication

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/register` | Registrasi pengguna |
| `POST` | `/login` | Login dan mendapatkan token |
| `GET` | `/me` | Data pengguna aktif |
| `POST` | `/update-password` | Mengubah password |
| `POST` | `/logout` | Logout dan menghapus token aktif |

## Dashboard

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/dashboard` | Ringkasan produk, mutasi hari ini, stok rendah, dan aktivitas terbaru |
| `GET` | `/dashboard/insights` | Analisis produk safe, warning, critical, fast-moving, dan slow-moving |

Filter opsional untuk endpoint insights:

```text
GET /dashboard/insights?warehouse_id=1
```

Hasil endpoint insights disimpan pada cache selama 60 detik per gudang.

## Kategori

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/categories` | Daftar kategori |
| `POST` | `/categories` | Menambah kategori |
| `PUT` | `/categories/{id}` | Mengubah kategori |
| `DELETE` | `/categories/{id}` | Menghapus kategori |

## Produk

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/products` | Daftar produk |
| `POST` | `/products` | Menambah produk |
| `PUT` | `/products/{id}` | Mengubah produk |
| `DELETE` | `/products/{id}` | Menghapus produk |
| `GET` | `/products/{id}/stocks` | Distribusi stok suatu produk |
| `GET` | `/products/{id}/stock-card` | Kartu stok dan histori produk |
| `GET` | `/products/movement-analysis` | Analisis pergerakan seluruh produk |

Filter analisis berdasarkan gudang:

```text
GET /products/movement-analysis?warehouse_id=1
```

## Gudang dan Lokasi

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/warehouses` | Daftar gudang |
| `POST` | `/warehouses` | Menambah gudang |
| `PUT` | `/warehouses/{id}` | Mengubah gudang |
| `DELETE` | `/warehouses/{id}` | Menghapus gudang |
| `GET` | `/warehouses/map` | Data peta gudang |
| `GET` | `/warehouse-locations` | Daftar lokasi/rak gudang |
| `POST` | `/warehouse-locations` | Menambah lokasi gudang |
| `PUT` | `/warehouse-locations/{id}` | Mengubah lokasi gudang |
| `DELETE` | `/warehouse-locations/{id}` | Menghapus lokasi gudang |

## Inventory

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/product-stocks` | Stok produk per gudang dan lokasi |
| `GET` | `/stock-alerts` | Produk berstatus warning atau critical |
| `POST` | `/mutations` | Membuat draft mutasi masuk/keluar |
| `PUT` | `/mutations/{id}/approve` | Menyetujui mutasi |
| `DELETE` | `/mutations/{id}/reject` | Menolak mutasi |

## Operasional Gudang

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/stock-transfers` | Transfer stok antar-gudang |
| `POST` | `/stock-adjustments` | Penyesuaian stok |
| `GET` | `/stock-opnames` | Daftar stock opname |
| `POST` | `/stock-opnames` | Membuat draft stock opname |
| `PUT` | `/stock-opnames/{id}/complete` | Menyelesaikan stock opname |

## Laporan

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/reports/mutations` | Histori dan laporan mutasi stok |

## Contoh Login

Request:

```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@warehouse.com",
  "password": "password123"
}
```

Contoh pemanggilan dashboard dengan token:

```http
GET /api/dashboard/insights
Authorization: Bearer <token>
Accept: application/json
```
