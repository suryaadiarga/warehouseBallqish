# 🏭 Warehouse Ballqish - WMS

Aplikasi **Warehouse Management System** yang terdiri dari:

- **Backend**: Laravel 12 + Sanctum (`backendBallqish/`)
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind (`frontendBallqish/`)

---

## ⚡ Quick Start

### Prasyarat

- Git
- PHP 8.2+
- Composer
- Node.js (untuk frontend, dan opsional untuk asset backend) + npm
- Database (pilih salah satu):
  - SQLite (paling mudah untuk local/dev), atau
  - MySQL/MariaDB

Catatan: project ini **tidak wajib** menggunakan Docker.

---

## 🚀 Setup & Run

### 1. Clone repository

```bash
git clone <repository-url>
cd warehouseBallqish
```

### 2. Setup backend (Laravel)

Masuk ke folder backend:

```bash
cd backendBallqish
```

Install dependencies:

```bash
composer install
```

#### Setup database
**MySQL/MariaDB**

Buat database kosong (misal `warehouse_ballqish`), lalu set `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=warehouse_ballqish
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migrasi + seeder:

```bash
php artisan migrate
php artisan db:seed
```

### 3. Jalankan backend API

Jalankan backend di port **8000** (sesuai default frontend):

```bash
php artisan serve --port=8000
```

Backend API tersedia di:

http://localhost:8000/api

### 4. Setup & jalankan frontend (Next.js)

Buka terminal baru dari root repo, lalu:

```bash
cd frontendBallqish
npm install

Jalankan development server:

```bash
npm run dev
```

Frontend tersedia di:

http://localhost:3000

---

## 🧪 Test Credentials

Setelah menjalankan `php artisan db:seed`, kamu bisa login dengan:

| Role  | Email               | Password      |
|------:|---------------------|---------------|
| Admin | admin@warehouse.com | password123   |
| Staff | staff@warehouse.com | password123   |

---

## 🗃️ Database Commands (Backend)

| Command | Deskripsi |
|---------|----------|
| `php artisan migrate` | Membuat/upgrade tabel database |
| `php artisan db:seed` | Mengisi database dengan data awal (seeder) |
| `php artisan migrate:fresh --seed` | Reset total database lalu seed ulang |

Seeder utama menjalankan: `UserSeeder`, `CategorySeeder`, `WarehouseSeeder`, `SupplierSeeder`, `ProductSeeder`, `StockMutationSeeder`.

---

## 🧰 Backend Commands (Laravel)

| Command | Deskripsi |
|---------|----------|
| `php artisan serve --port=8000` | Menjalankan API server |
| `php artisan queue:listen --tries=1` | Menjalankan queue worker (opsional) |
| `composer run dev` | Menjalankan server + queue + Vite (opsional, 1 perintah) |
| `composer run setup` | Install deps + copy env + generate key + migrate + build assets |

---

## 🖥️ Frontend Commands (Next.js)

| Command | Deskripsi |
|---------|----------|
| `npm run dev` | Menjalankan frontend mode development |
| `npm run build` | Build production |
| `npm run start` | Menjalankan hasil build production |
| `npm run lint` | Menjalankan ESLint |

---

## 🔧 Troubleshooting

- **500 / APP_KEY error**: pastikan `.env` ada dan sudah `php artisan key:generate`.
- **401 terus / gagal login**: pastikan `NEXT_PUBLIC_API_BASE_URL` mengarah ke backend yang sedang berjalan (contoh `http://localhost:8000/api`).
- **Error DB**: cek konfigurasi `.env` (DB_CONNECTION, DB_DATABASE/host/credential), lalu ulangi `php artisan migrate`.

---

## 📂 Struktur Project

```text
warehouseBallqish/
├─ backendBallqish/   # Laravel API
└─ frontendBallqish/  # Next.js UI
```
