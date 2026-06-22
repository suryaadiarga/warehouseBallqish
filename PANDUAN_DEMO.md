# Panduan Demo Ballqish Warehouse Management System

Panduan ini mencakup persiapan dan alur demonstrasi aplikasi web serta mobile Ballqish WMS.

## Persiapan Demo

- Backend Laravel aktif di `http://localhost:8080/api`.
- Web Next.js aktif di `http://localhost:3000`.
- Akun demo:
  - Admin: `admin@warehouse.com`
  - Staff: `staff@warehouse.com`
  - Password: `password123`

Mobile memakai alamat default port `8888`, sedangkan backend dijalankan pada port `8080`. Untuk Android Emulator, jalankan:

```powershell
cd "C:\KULIAH Code\Semester 6\ABP\warehouseBallqish\app_ballqish"
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080/api
```

## Poin Demo Web

### 1. Login dan Autentikasi

- Login sebagai admin.
- Tunjukkan proteksi halaman dashboard.
- Jelaskan penggunaan token Laravel Sanctum.
- Demonstrasikan logout.

### 2. Dashboard

- Total produk.
- Stok masuk dan keluar hari ini.
- Peringatan stok rendah.
- Aktivitas mutasi terbaru.
- Insight produk yang perlu perhatian.

### 3. Master Data

- Tambah kategori.
- Tambah produk beserta SKU, kategori, dan minimum stok.
- Tambah gudang.
- Tambah lokasi atau rak di dalam gudang.
- Tunjukkan validasi dan konfirmasi penghapusan.

### 4. Monitoring Persediaan

- Lihat stok per produk, gudang, dan lokasi.
- Gunakan filter pencarian.
- Buka detail distribusi stok produk.
- Buka kartu stok untuk melihat histori pergerakan barang.

### 5. Mutasi Stok

- Buat draft barang masuk atau barang keluar.
- Pilih produk, gudang, lokasi, dan kuantitas.
- Login sebagai admin untuk menyetujui atau menolak mutasi.
- Tunjukkan bahwa stok berubah setelah mutasi disetujui.

### 6. Transfer Antar-Gudang

- Pilih produk, gudang asal, dan gudang tujuan.
- Tunjukkan validasi bahwa gudang asal dan tujuan harus berbeda.
- Proses transfer.
- Jelaskan bahwa sistem membuat mutasi keluar dan masuk dengan satu transfer ID.

### 7. Stock Adjustment

- Lakukan koreksi stok.
- Masukkan alasan penyesuaian.
- Tunjukkan hasil perubahan persediaan.

### 8. Stock Opname

- Buat draft opname.
- Masukkan jumlah fisik produk.
- Selesaikan opname.
- Jelaskan bahwa selisih menghasilkan penyesuaian stok otomatis.

### 9. Analitik

- Stock alert dengan status `critical` dan `warning`.
- Movement analysis untuk produk fast-moving dan slow-moving.
- Warehouse map untuk melihat distribusi gudang dan stok.

### 10. Laporan

- Tampilkan histori mutasi.
- Filter laporan berdasarkan periode dan parameter yang tersedia.
- Demonstrasikan export CSV untuk kebutuhan audit.

### 11. Role Pengguna

- Bandingkan hak akses admin gudang dan staff.
- Staff dapat membuat draft operasional.
- Operasi penting seperti approval dilakukan oleh admin.

### 12. Profil dan Keamanan

- Tampilkan informasi pengguna aktif.
- Demonstrasikan perubahan password.
- Logout dari sistem.

## Poin Demo Mobile

### 1. Login dan Session

- Login menggunakan akun yang sama dengan web.
- Tunjukkan bahwa session tetap tersimpan setelah aplikasi dibuka ulang.
- Demonstrasikan logout.

### 2. Dashboard Mobile

- Total produk.
- Stok masuk hari ini.
- Stok keluar hari ini.
- Jumlah alert stok rendah.
- Aktivitas terbaru.

### 3. Navigasi Utama

- Dashboard.
- Produk.
- Kategori.
- Gudang.
- Lokasi gudang.
- Stok dan mutasi.

### 4. Kelola Master Data

- Tambah, edit, dan hapus kategori.
- Tambah, edit, dan hapus produk.
- Tambah, edit, dan hapus gudang.
- Tambah, edit, dan hapus lokasi gudang.
- Tunjukkan dialog konfirmasi sebelum menghapus.

### 5. Monitoring Stok

- Lihat jumlah stok produk.
- Lihat gudang dan kode lokasi penyimpanan.
- Gunakan pull-to-refresh untuk mengambil data terbaru.

### 6. Mutasi dari Lapangan

- Buat draft barang masuk atau keluar.
- Pilih produk, gudang, dan lokasi.
- Masukkan kuantitas dan catatan.
- Tunjukkan status draft pada histori mutasi.

## Skenario Demo Integrasi

Skenario berikut menunjukkan bahwa aplikasi web dan mobile menggunakan backend serta database yang sama:

1. Buat mutasi barang masuk melalui aplikasi mobile.
2. Buka web menggunakan akun admin.
3. Cari draft mutasi yang baru dibuat.
4. Setujui mutasi melalui web.
5. Periksa perubahan pada Product Stocks dan kartu stok.
6. Refresh aplikasi mobile.
7. Tunjukkan status mutasi dan jumlah stok yang sudah tersinkronisasi.

## Urutan Presentasi yang Disarankan

1. Jelaskan masalah pengelolaan stok yang diselesaikan oleh Ballqish WMS.
2. Jelaskan arsitektur Laravel API, Next.js, Flutter, dan database MySQL.
3. Demonstrasikan login dan dashboard web.
4. Demonstrasikan master data dan monitoring stok.
5. Jalankan transaksi stok melalui mobile.
6. Setujui transaksi melalui web.
7. Tunjukkan sinkronisasi data pada kedua aplikasi.
8. Tutup dengan fitur analitik, laporan, keamanan, dan pembagian role.

## Nilai Utama Sistem

- Web dan mobile terintegrasi melalui satu REST API.
- Data stok dipisahkan berdasarkan gudang dan lokasi penyimpanan.
- Setiap pergerakan stok mempunyai histori yang dapat diaudit.
- Operasi penting dilindungi oleh autentikasi dan pembagian role.
- Sistem menyediakan dashboard, peringatan stok, analitik, dan laporan.
