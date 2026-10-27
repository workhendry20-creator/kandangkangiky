# Dokumentasi Keseluruhan Proyek Kandang Kang Iky
**Platform Manajemen Penggemukan Domba Qurban, Inventaris Kandang & Customer Tracking Real-Time**

---

## 1. Ikhtisar Proyek (Project Overview)

**Kandang Kang Iky** adalah platform berbasis web modern yang menggabungkan manajemen operasional peternakan internal dengan transparansi pelacakan hewan qurban untuk customer/shohibul qurban secara *real-time*.

Platform ini mengintegrasikan:
- **Portal Publik & Lacak Ternak**: Akses instan tanpa login bagi customer untuk memantau kenaikan bobot harian/mingguan, riwayat rekam medis, galeri foto dokumentasi, dan usia ternak secara realtime.
- **Admin Console**: Panel kendali komprehensif bagi owner dan tim pengelola peternakan untuk mengelola data penitipan domba, mencatat timbang berkala, manajemen breeding/indukan/pejantan kandang, dan sinkronisasi otomatis ke Google Sheets.
- **Google Sheets Cloud Sync**: Integrasi webhook dua arah untuk memastikan seluruh catatan tersimpan aman dan terkelola di Google Spreadsheet pengelola.

### Tech Stack Utama
- **Framework**: Next.js 16.4.0 (App Router, Server Components & Server Actions)
- **Library UI & Core**: React 19.3.0, TypeScript 5, Lucide Icons, Recharts
- **Styling**: Tailwind CSS v4, PostCSS (`@tailwindcss/postcss`), Custom Sage Green Theme
- **Database & Storage**: Supabase (PostgreSQL, Supabase Storage untuk media/foto)
- **Otentikasi**: Custom Secure Session Cookie (`admin_session`) & Supabase Auth Fallback
- **Integrasi Eksternal**: Google Apps Script Webhook API (Sheet Titipan, Master Kandang, & Kelahiran/Tindakan)

---

## 2. Modul & Fitur yang Telah Selesai Dikerjakan

### A. Portal Customer & Tracking Publik (`/` dan `/track/[code]`)
1. **Halaman Beranda (`app/page.tsx`)**:
   - Form pencarian kode tracking domba (*Tracking Code*) dengan validasi format otomatis.
   - Hero section modern dengan tipografi *Plus Jakarta Sans* dan aksen Sage Green.
   - 3 Highlight value proposition: Grafik Bobot Akurat, Rekam Medis & Pakan, Dokumentasi Visual Kandang.
   - Tata letak 100% responsif di layar ponsel, tablet, dan desktop.

2. **Halaman Tracking Domba Customer (`app/track/[code]/page.tsx`)**:
   - **Header Profil Domba**: Menampilkan ID unik, ras domba, nama shohibul qurban, dan status pemeliharaan.
   - **Informasi Umur Realtime Otomatis**:
     * Perhitungan presisi selisih hari ini dengan tanggal kedatangan (`entry_date` / `arrival_date`).
     * 3 Kartu metrik usia: Tanggal Kedatangan, Total Umur dalam Hari, dan Total Umur Format Kalender (Bulan & Hari).
     * Indikator denyut realtime (*pulsing dot*).
   - **5 Kartu Ringkasan Metrik**:
     * Ras & Gender domba.
     * BB Awal saat masuk kandang.
     * BB Saat Ini beserta indikator delta kenaikan bobot (*net weight gain*).
     * Target Bobot Iduladha & persentase capaian progress.
     * Kartu Hitung Mundur Hari Menuju Iduladha 1447H (*Countdown Card*).
   - **Grafik Pertumbuhan Bobot Interaktif (`components/tracker/WeightChart.tsx`)**:
     * Visualisasi garis tren kenaikan berat badan berbasis Recharts.
     * Garis putus-putus emas untuk target bobot akhir vs garis solid Sage Green untuk bobot riil pengukuran berkala.
   - **Linimasa Riwayat Berkala: Compact Datasheet Table (`components/tracker/ProgressFeed.tsx`)**:
     * Menggantikan timeline memanjang menjadi tabel data ringkas yang muat banyak informasi.
     * Kolom: **Tanggal Update** (dengan badge *Terbaru* pada rekaman terkini), **Jenis Update** (Harian / Timbangan Mingguan), **BB (kg) & Kenaikan** (dengan ikon trend naik/turun), **Status Kesehatan** (Badge Sehat / Dalam Perawatan / Sakit), dan **Catatan & Dokumentasi Foto**.
     * **Paginasi & Collapse Toggle**: Default menampilkan maksimal 5 riwayat terbaru dengan tombol interaktif *"Lihat Semua Riwayat"* dan *"Tampilkan 5 Catatan Saja"*.
     * **Fullscreen Lightbox**: Pratinjau foto dokumentasi kandang beresolusi tinggi saat thumbnail diklik.
   - **Quick Action Bar (`components/tracker/TrackerActions.tsx`)**:
     * Tombol salin tautan langsung (*Copy Tracking Link*).
     * Tombol hubungi peternak via WhatsApp resmi dengan pesan terformat otomatis menyertakan kode domba.

---

### B. Otentikasi & Keamanan Pengelola (`/admin/login`)
1. **Sistem Login Multi-Layer (`lib/actions/auth.ts`)**:
   - Pengecekan kredensial aman terhadap tabel `admin_users` menggunakan enkripsi hash kata sandi BCrypt.
   - Fallback otomatis ke Supabase Auth jika menggunakan kredensial email Supabase.
   - Pembuatan HTTP-only session cookie (`admin_session`) yang tahan terhadap serangan XSS.
2. **Proteksi Middleware (`middleware.ts`)**:
   - Melindungi seluruh rute `/admin/*` dari akses publik tidak berizin.
   - Redirect otomatis ke `/admin/login?redirectedFrom=...` dengan pengembalian URL asal pasca login sukses.
3. **Komponen Navigasi Admin (`components/admin/AdminNavbar.tsx`)**:
   - Menyatukan akses navigasi antara **Titipan & Qurban** (`/admin/dashboard`) dan **Inventaris Kandang** (`/admin/farm-sheep`).
   - Informasi profil admin aktif dan inisial akun.
   - Menu *Hamburger Drawer* yang rapi untuk perangkat mobile & tablet.
   - Tombol logout aman (`components/admin/LogoutButton.tsx`) yang membersihkan session cookie dan state aplikasi.

---

### C. Dashboard Master Domba Titipan (`/admin/dashboard`)
1. **Statistik Operasional (KPI Cards)**:
   - Total Populasi Ternak Aktif di kandang.
   - Total Customer / Shohibul Qurban terverifikasi.
   - Jumlah Domba dalam Status Penitipan Aktif.
   - Rata-rata Bobot Ternak hasil timbangan digital terkalibrasi.
2. **Tabel Master Data Domba Titipan (`components/admin/SheepTable.tsx`)**:
   - Kolom: Tracking Code, Nama Customer, Ras & Gender, BB Awal, BB Terkini, Target BB, Status, dan Tombol Aksi.
   - Pencarian instan (kode domba, nama mitra, ras).
   - Filter dropdown status (*Penitipan*, *Selesai/Terkirim*, *Terjual*).
   - Salin tracking code sekali klik.
   - Touch-scroll halus dengan `overscroll-x-contain` dan lebar minimum yang aman di layar HP.

---

### D. Form Pendaftaran & Pencatatan Perkembangan
1. **Registrasi Domba Baru (`components/admin/NewSheepForm.tsx`)**:
   - Generator otomatis kode tracking unik standar `KKY-XXXXX` dengan tombol acak ulang.
   - Perekaman data lengkap: Nama Customer, Nomor WhatsApp, Ras, Gender, BB Awal Masuk, Target BB, Tanggal Masuk.
   - Validasi ketat (target bobot harus lebih besar dari bobot awal, format input numerik aman).
2. **Input Perkembangan Bobot & Medis Mobile (`components/admin/ProgressForm.tsx`)**:
   - Dirancang khusus untuk kemudahan input tim peternak langsung dari kandang via smartphone.
   - Input bobot fleksibel berbasis **Delta Penambahan (+kg)** atau **Total Bobot Baru**.
   - **Kompresi Gambar Otomatis**: Integrasi `browser-image-compression` untuk memperkecil ukuran foto dokumentasi hingga ~80% sebelum diunggah ke Supabase Storage, menghemat bandwidth dan mempercepat loading customer.
   - Perekaman status kesehatan (*Sehat*, *Dalam Perawatan*, *Sakit*) dan catatan ransum pakan.
   - **Sinkronisasi Otomatis Google Sheets (`Log_Titipan`)**: Mengirim payload lengkap (dengan alias `sheet_name`, `sheet`, `tracking_code`, `code`, `tag_id`, `current_weight`, `delta_weight`, dll.) ke URL webhook Google Apps Script (`GOOGLE_SHEETS_WEB_APP_URL` / `GOOGLE_APPS_SCRIPT_URL`) secara real-time pada setiap input perkembangan tanpa memerlukan tombol sinkronisasi manual.

---

### E. Modul Inventaris Kandang & Breeding Internal (TASK 6)
Terletak pada route `/admin/farm-sheep`, modul ini mengelola domba milik peternakan sendiri tanpa mencampuri data titipan qurban customer:

1. **Tab 1: Master Domba Kandang (`components/admin/farm/FarmSheepTable.tsx`)**:
   - Manajemen populasi internal: Indukan, Pejantan/Pemacek, dan Anakan (Cempe).
   - Tracking status reproduksi: *Hamil*, *Menyusui*, *Kosongan*, *Kosongan/Menyusui*, *Pemacek*, *Siap Kawin*, *Afkir*.
   - Filter berdasarkan Tipe dan Status.
   - Fitur Edit Data Domba (`EditFarmSheepModal.tsx`) dan Hapus dengan cascade warning.
   - **Import CSV Massal (`ImportCsvModal.tsx`)**:
     * Upload file spreadsheet `.csv` atau tempel teks data CSV langsung.
     * Auto-detect header kolom: `tag_code`, `name`, `gender`, `breed`, `origin`, `entry_date`, `initial_weight`, `status`, `sheep_type`, `notes`.
     * Validasi data baris dan tabel pratinjau responsif sebelum eksekusi impor.
2. **Tab 2: Catatan Kelahiran Cempe (`components/admin/farm/BirthEventsTable.tsx`, `NewBirthModal.tsx`)**:
   - Pencatatan kelahiran anakan baru: pemilihan induk betina, tanggal persalinan, jumlah anak, dan catatan kondisi anak.
   - **Otomatisasi Status Induk**: Sistem otomatis memperbarui status domba induk menjadi *"Kosongan/Menyusui"* di database Supabase dan Google Sheets begitu kelahiran tercatat.
3. **Tab 3: Rekam Medis & Tindakan Kandang (`components/admin/farm/TreatmentEventsTable.tsx`, `NewTreatmentModal.tsx`)**:
   - Perekaman tindakan preventif dan kuratif: Vaksinasi, Pemberian Obat Cacing, Injeksi Vitamin, Sanitasi, dan Potong Kuku.
   - Catatan dosis dan histori penanganan per ekor ternak atau per kelompok.
4. **Sinkronisasi Dua Arah Google Sheets (`components/admin/farm/SyncSheetsButton.tsx`, `lib/actions/farm-sheep.ts`)**:
   - Setiap aksi tambah, ubah, atau hapus otomatis mengirim payload ke Google Apps Script Webhook.
   - Tombol manual *"Sync Sheets"* untuk sinkronisasi massal sewaktu-waktu.
   - Pemisahan lembar kerja otomatis: Sheet `Master_Kandang` dan Sheet `Kelahiran_Tindakan`.

---

### F. Sistem Desain Sage Green & Anti-AI Slop
Berdasarkan pedoman `.cursorrules` dan `DESIGN_SYSTEM.md`:
- **Palet Warna Terkurasi**:
  * Primary: `#89A482` (Sage Green hangat)
  * Dark Accent: `#5C6F57` (Deep Sage untuk tombol utama, teks kontras, dan active state)
  * Light Accent: `#B1C5AA` (Soft border dan pembatas visual)
  * Soft Tint: `#D9E5D6` (Badge latar dan highlight lembut)
  * Page Background: `#EBF2E8` (Latar belakang natural yang nyaman di mata)
- **Prinsip Anti-AI Slop**:
  * Menghilangkan drop-shadow tebal berwarna ungu/neon.
  * Mengganti border default tebal dengan border tipis elegan (`border-[#B1C5AA]/40`).
  * Menggunakan tipografi modern Plus Jakarta Sans yang ramah dan profesional.
  * Menghilangkan tombol-tombol redundan pada hero banner.

---

### G. Optimasi Responsivitas Penuh (Mobile, Tablet, Desktop)
- **Container Terstandarisasi**: Menggunakan `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (atau `max-w-5xl` pada portal publik) agar margin samping konsisten di semua resolusi.
- **Grid Fleksibel**:
  * Dashboard Stats: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
  * Highlight Fitur: `grid grid-cols-1 md:grid-cols-3 gap-4`.
  * Tracking Metrics: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5` dengan banner countdown adaptif span-2 di mobile.
- **Scroll Aman Mobile**: Semua tabel data dilengkapi pembungkus `overflow-x-auto overscroll-x-contain` dengan batas lebar minimum (`min-w-[620px]` hingga `min-w-[800px]`) sehingga kolom tidak saling tumpuk saat dibuka di smartphone.
- **Modal Responsif**: Semua modal popup dilengkapi `my-auto max-h-[92dvh] overflow-y-auto p-5 sm:p-7` agar tidak pernah terpotong oleh browser bar pada ponsel vertikal maupun landscape.

---

### H. Konfigurasi Tailwind CSS v4 & PostCSS untuk Produksi (Vercel)
Mengatasi kendala *unstyled CSS* saat deployment di Vercel:
1. **Instalasi Plugin PostCSS**: Menambahkan dependency `@tailwindcss/postcss` pada `devDependencies`.
2. **File Konfigurasi PostCSS (`postcss.config.mjs`)**: Mengaktifkan `@tailwindcss/postcss` agar compiler Next.js memproses seluruh utility classes Tailwind saat build produksi.
3. **File Konfigurasi Tailwind (`tailwind.config.js`)**: Mendefinisikan cakupan direktori `content`:
   ```js
   content: [
     "./app/**/*.{js,ts,jsx,tsx,mdx}",
     "./components/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/**/*.{js,ts,jsx,tsx,mdx}",
   ]
   ```
4. **Penyambungan CSS Global (`app/globals.css`)**: Menggunakan direktif `@import "tailwindcss";` dan `@config "../tailwind.config.js";`.
5. **Verifikasi Build**: `npm run build` tervalidasi sukses **0 error** dengan file CSS produksi ter-bundle utuh (~65 KB).

---

## 3. Peta Struktur File Proyek

```
kandangkangiky/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx         # Dashboard utama penitipan & qurban
│   │   ├── farm-sheep/page.tsx        # Modul inventaris & breeding kandang (TASK-6)
│   │   ├── login/page.tsx             # Halaman login admin
│   │   ├── sheep/
│   │   │   ├── new/page.tsx           # Registrasi domba titipan baru
│   │   │   └── [id]/progress/page.tsx # Input perkembangan bobot berkala
│   │   └── layout.tsx                 # Layout pembungkus admin (Navbar & background)
│   ├── track/
│   │   └── [code]/page.tsx            # Portal publik pelacakan customer (realtime)
│   ├── globals.css                    # Styling global, token warna Sage Green & Tailwind
│   ├── layout.tsx                     # Root layout aplikasi (Font Jakarta Sans & metadata)
│   └── page.tsx                       # Halaman beranda utama portal publik
│
├── components/
│   ├── admin/
│   │   ├── farm/                      # Komponen modul inventaris kandang
│   │   │   ├── BirthEventsTable.tsx   # Tabel catatan kelahiran cempe
│   │   │   ├── EditFarmSheepModal.tsx # Modal edit data domba
│   │   │   ├── FarmSheepManagement.tsx# Wrapper tab inventaris & stat cards
│   │   │   ├── FarmSheepTable.tsx     # Tabel master domba kandang
│   │   │   ├── ImportCsvModal.tsx     # Modal import massal file/teks CSV
│   │   │   ├── NewBirthModal.tsx      # Modal rekam kelahiran baru
│   │   │   ├── NewFarmSheepModal.tsx  # Modal tambah domba kandang
│   │   │   ├── NewTreatmentModal.tsx  # Modal rekam medis & tindakan
│   │   │   ├── SyncSheetsButton.tsx   # Tombol sinkronisasi manual ke Google Sheets
│   │   │   └── TreatmentEventsTable.tsx# Tabel rekam medis & tindakan
│   │   ├── AdminNavbar.tsx            # Header navigasi global admin & mobile drawer
│   │   ├── LogoutButton.tsx           # Tombol sign out admin
│   │   ├── NewSheepForm.tsx           # Form pendaftaran domba titipan
│   │   ├── ProgressForm.tsx           # Form input timbang & foto berkala
│   │   └── SheepTable.tsx             # Tabel master data domba titipan
│   │
│   └── tracker/                       # Komponen portal pelacakan customer
│       ├── CountdownCard.tsx          # Kartu hitung mundur Iduladha 1447H
│       ├── ProgressFeed.tsx           # Linimasa riwayat perkembangan (datasheet table)
│       ├── TrackerActions.tsx         # Tombol share link & WhatsApp peternak
│       └── WeightChart.tsx            # Grafik kurva bobot interaktif (Recharts)
│
├── lib/
│   ├── actions/
│   │   ├── auth.ts                    # Server action autentikasi admin & session cookie
│   │   ├── farm-sheep.ts              # Server action CRUD inventaris kandang & sheet sync
│   │   ├── progress.ts                # Server action pencatatan log timbang & sync
│   │   └── sheep.ts                   # Server action pendaftaran & query domba titipan
│   ├── supabase/
│   │   ├── client.ts                  # Supabase browser client
│   │   └── server.ts                  # Supabase server client (Service Role & Cookies)
│   └── utils.ts                       # Helper format tanggal, kalkulasi umur, kg, kode ID
│
├── types/
│   ├── farm-sheep.ts                  # Definisi TypeScript domba kandang & rekam medis
│   └── sheep.ts                       # Definisi TypeScript domba titipan & progress logs
│
├── public/
│   └── logo.jpg                       # Logo resmi Kandang Kang Iky
│
├── .cursorrules                       # Konfigurasi aturan desain Sage Green & Anti-AI Slop
├── middleware.ts                      # Proteksi route guard untuk seluruh /admin/*
├── next.config.ts                     # Konfigurasi Next.js (images remote pattern, turbopack)
├── package.json                       # Dependencies & script Next.js
├── postcss.config.mjs                 # Konfigurasi PostCSS Tailwind v4
├── schema.sql                         # Skema database PostgreSQL / Supabase lengkap
├── tailwind.config.js                 # Konfigurasi Tailwind (content paths & custom colors)
└── DOKUMENTASI_PROYEK.md              # File dokumentasi menyeluruh proyek ini
```

---

## 4. Panduan Menjalankan Proyek

### A. Environment Variables (`.env.local`)
Pastikan variabel lingkungan berikut terisi di root proyek:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Google Sheets Integration (Webhook Apps Script)
GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec"
```

### B. Perintah Pengembangan (Scripts)
- **Menjalankan Dev Server**:
  ```bash
  npm run dev
  ```
  Aplikasi akan berjalan di `http://localhost:3000`.

- **Mengecek Kesalahan TypeScript & Build Produksi**:
  ```bash
  npm run build
  ```
  Menghasilkan build produksi teroptimasi dan memverifikasi tidak ada error sintaks/tipe.

- **Linting Kode**:
  ```bash
  npm run lint
  ```

---

## 5. Ringkasan Status Commit & Rilis

Semua tahapan pengembangan telah diuji, dibersihkan dari artefak, dan digabungkan secara utuh ke branch utama (**`main`**):
- **Commit Terkini**: `29fcddf` (*fix(css): configure postcss and tailwind content for production deployment*)
- **Status Build**: Passing (0 Error, 0 Warning)
- **Deployment**: Terhubung otomatis ke Vercel dengan auto-redeploy pada branch `main`.

---
*Dokumentasi ini dibuat secara komprehensif sebagai referensi resmi arsitektur, fitur, dan pemeliharaan aplikasi Kandang Kang Iky.*
