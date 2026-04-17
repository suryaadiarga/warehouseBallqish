# Ballqish WMS Frontend

Frontend Warehouse Management System Ballqish berbasis:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Axios
- lucide-react

## Fokus Project

Frontend ini terhubung ke backend Laravel WMS dan mencakup modul:

- Authentication
- Dashboard dan insights
- Master data
- Inventory detail
- Warehouse operations
- Analytics
- Warehouse map

## Menjalankan Project

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Environment

Frontend memakai `NEXT_PUBLIC_API_BASE_URL`.

Jika env tidak diisi, fallback saat ini adalah:

```bash
http://localhost:8888/api
```

## Struktur Utama

- `app/` untuk route App Router
- `components/modules/` untuk modul halaman per domain
- `components/ui/` untuk reusable UI
- `components/providers/` untuk auth dan toast
- `lib/api.ts` untuk Axios client dan auth storage
- `lib/auth.ts` untuk type user dan helper role
- `lib/format.ts` untuk helper format tampilan

## Catatan

- Jangan ubah kontrak API frontend tanpa memastikan backend Laravel mendukungnya.
- Semua list backend memakai envelope `success`, `message`, `data`, `meta`.
- Jangan tambahkan mock data untuk fitur utama yang sudah tersedia dari backend.
