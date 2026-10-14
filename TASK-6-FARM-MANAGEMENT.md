# TASK 6: Modul Inventaris & Breeding Domba Kandang

## Objective
Mengimplementasikan Navbar Admin global dan Modul Manajemen Ternak Internal Kandang (Indukan, Pejantan, Rekam Kelahiran, dan Tindakan Medis) tanpa mengganggu fitur Domba Titipan yang sudah ada.

## Key Requirements

### 1. Global Admin Navbar (`components/admin/AdminNavbar.tsx`)
- Buat header navigasi di atas `/admin/*` dengan menu:
  - **Titipan & Qurban** (`/admin/dashboard`)
  - **Inventaris Kandang** (`/admin/farm-sheep`)
  - **Logout / Profile**

### 2. Modul Inventaris Kandang (`app/admin/farm-sheep/page.tsx`)
- Terapkan `export const dynamic = 'force-dynamic';` dan `export const revalidate = 0;`.
- Buat 3 Sub-Tab Interaktif:
  - **Tab 1: Master Domba Kandang**
    - Tabel data `farm_sheep`: ID Domba, Nama, Gender, Jenis, Asal (Beli/Beranak), Tgl Kedatangan, BB Awal, Status (Hamil, Kosongan, Pemacek), Tipe (Pejantan/Indukan).
    - Form Modal "+ Tambah Domba Kandang".
    - Fitur "Import CSV" untuk registrasi massal.
  - **Tab 2: Catatan Kelahiran**
    - Form penambahan kelahiran (Pilih Induk, Tgl Lahir, Jumlah Anak, Keterangan).
    - Otomatis memperbarui status Induk menjadi "Kosongan/Menyusui".
  - **Tab 3: Rekam Medis & Tindakan**
    - Form penambahan tindakan (Pilih Domba, Nama Tindakan, Tgl Tindakan, Keterangan).

### 3. Server Actions & Sync
- Buat Server Action `lib/actions/farm-sheep.ts` untuk CRUD tabel `farm_sheep` dan `farm_events`.
- Integrasikan kirim POST payload JSON ke `GOOGLE_APPS_SCRIPT_URL` (non-blocking fallback) untuk pencatatan otomatis di Sheet 2 (`Master_Kandang`) dan Sheet 3 (`Kelahiran_Tindakan`).

## Rules
- DILARANG memanggil tool MCP Supabase.
- Pastikan `npm run build` dan `npm run lint` passing dengan 0 error.