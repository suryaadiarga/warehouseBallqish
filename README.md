# 🏭 Warehouse Ballqish - WMS

Aplikasi **Warehouse Management System** yang terdiri dari:

- **Backend**: Laravel 12 + Sanctum (`backendBallqish/`)
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind (`frontendBallqish/`)
- **Mobile**: Flutter Android (`app_ballqish/`)

---

## ⚡ Quick Start

### Jalankan otomatis (Windows)

Setelah repository selesai di-clone, jalankan dari root project:

```powershell
.\start.cmd
```

Script akan otomatis:

- memasang dependency Composer jika `vendor/` belum tersedia;
- memasang dependency npm jika `node_modules/` belum tersedia;
- membuat `.env` dan Laravel application key jika belum tersedia;
- membuat direktori runtime Laravel; dan
- menjalankan backend di port `8080` serta frontend di port `3000`.

Untuk memaksa instalasi ulang dependency:

```powershell
.\start.cmd -Install
```

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
git clone https://github.com/suryaadiarga/warehouseBallqish.git
```

Masuk ke project:

```bash
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

Generate key:

```bash
php artisan key:generate
```

#### Setup database
**MySQL/MariaDB**
**Pastikan file .env.example yang ada di backendBallqish diubah ke .env**

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

Jalankan backend di port **8080** (sesuai default frontend):

```bash
php artisan serve --host=0.0.0.0 --port=8080
```

Backend API tersedia di:

http://localhost:8080/api

Untuk Android Emulator, gunakan:

```txt
http://10.0.2.2:8080/api
```

Untuk HP fisik, gunakan IP komputer di jaringan yang sama, contoh:

```txt
http://192.168.1.10:8080/api
```

### 4. Setup & jalankan frontend (Next.js)

Buka terminal baru dari root repo, lalu:

Masuk ke folder frontend:
```bash
cd frontendBallqish
```

Install dependencies:
```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Frontend tersedia di:

http://localhost:3000

---

## 🧪 Test Credentials

Setelah menjalankan `php artisan db:seed`, kamu bisa login dengan:

| Role | Email | Password |
|-----:|-------|----------|
| Warehouse Manager | admin@warehouse.com | password123 |
| Warehouse Staff | staff@warehouse.com | password123 |
| Inventory Controller | inventory@warehouse.com | password123 |
| Super Admin | boss@warehouse.com | password123 |
| Warehouse Manager 1-3 | admin1@warehouse.com s.d. admin3@warehouse.com | password123 |
| Warehouse Staff 1-3 | staff1@warehouse.com s.d. staff3@warehouse.com | password123 |
| Inventory Controller 1-3 | inventory1@warehouse.com s.d. inventory3@warehouse.com | password123 |

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
| `php artisan serve --host=0.0.0.0 --port=8080` | Menjalankan API server untuk web, emulator, dan device satu jaringan |
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

## Mobile App Auto Update

Aplikasi Flutter Android mengecek pembaruan dari endpoint publik:

```txt
GET /api/mobile/version
```

Saat `version_code` server lebih besar dari build yang terpasang, aplikasi akan menampilkan dialog pembaruan, mengunduh APK dari `download_url`, memvalidasi `sha256` jika tersedia, lalu membuka installer Android.

Konfigurasi versi ada di `.env` backend:

```env
MOBILE_APP_VERSION_NAME=1.0.1
MOBILE_APP_VERSION_CODE=2
MOBILE_APP_MINIMUM_VERSION_CODE=1
MOBILE_APP_APK_PATH=mobile/ballqish-latest.apk
MOBILE_APP_SHA256=
MOBILE_APP_RELEASE_NOTES="Pembaruan stabilitas dan perbaikan bug."
```

Alur rilis update:

1. Naikkan versi Flutter di `app_ballqish/pubspec.yaml`, contoh `version: 1.0.2+3`.
2. Build APK Android.
3. Upload APK ke `backendBallqish/public/mobile/ballqish-latest.apk` di server.
4. Set `MOBILE_APP_VERSION_CODE` lebih tinggi dari build lama.
5. Isi `MOBILE_APP_SHA256` agar APK yang diunduh bisa diverifikasi.
6. Jalankan `php artisan config:clear` atau refresh config cache di server.

Catatan Android: instalasi APK tetap memerlukan persetujuan user dan izin "Install unknown apps" untuk aplikasi ini. Android tidak mengizinkan aplikasi non-Play Store mengganti APK sendiri tanpa konfirmasi user.

---

## 🔧 Troubleshooting

- **500 / APP_KEY error**: pastikan `.env` ada dan sudah `php artisan key:generate`.
- **401 terus / gagal login**: pastikan `NEXT_PUBLIC_API_BASE_URL` mengarah ke backend yang sedang berjalan (contoh `http://localhost:8080/api`).
- **Error DB**: cek konfigurasi `.env` (DB_CONNECTION, DB_DATABASE/host/credential), lalu ulangi `php artisan migrate`.

---

## 📂 Struktur Project

```text
warehouseBallqish/
├─ backendBallqish/   # Laravel API
├─ frontendBallqish/  # Next.js UI
└─ app_ballqish/      # Flutter Android app
```
