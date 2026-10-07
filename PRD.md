# Product Requirement Document (PRD) & Execution Plan

**Proyek:** Kandang Kang Iky - Livestock Progress Tracker & Care Management System

**Versi:** 1.0 (MVP)

**Status:** Ready for Development

---

## 1. Product Overview & Goals

### 1.1 Executive Summary

**Kandang Kang Iky** adalah startup peternakan yang menawarkan layanan jual-beli domba dengan *Unique Selling Proposition (USP)* perawatan/penitipan hingga Iduladha. Web App ini dibangun untuk mengatasi kendala operasional laporan manual via WhatsApp satu per satu, dengan memberikan platform terintegrasi yang otomatis, transparan, dan mudah digunakan oleh owner maupun customer.

### 1.2 Core Business Goals

1. **Efisiensi Operasional:** Memangkas waktu update progress harian/mingguan dari puluhan jam via chat WA menjadi beberapa detik melalui form input terstruktur.
2. **Transparansi & Retention Customer:** Memberikan akses pemantauan bobot, kesehatan, dan foto domba secara real-time untuk meningkatkan kepercayaan customer.
3. **Kemudahan Akses (Low Friction):** Akses customer tanpa login (*token-based ID*), serta akses owner yang terintegrasi dengan ekosistem **Google (Google OAuth & Google Sheets)**.

---

## 2. Target Users & Access Model

| User Role | Access Method | Key Responsibilities & Capabilities |
| --- | --- | --- |
| **Customer** | Public / Token-Based (`/track/[trackingCode]`) | Memantau perkembangan BB, grafik kenaikan, status kesehatan, galeri foto, serta kemudahan bagikan link / hubungi admin via WA. |
| **Owner / Admin** | Protected / Google OAuth (`/admin/*`) | Menambah domba baru, update progress berkala, upload foto/video dari HP, melihat rekap tabel, serta otomatisasi sinkronisasi ke Google Sheets. |

---

## 3. Architecture & Tech Stack

* **Frontend Framework:** Next.js (App Router) + TypeScript
* **UI Components & Styling:** Tailwind CSS + `shadcn/ui` + Lucide Icons + Recharts (Grafik BB)
* **Backend & Database:** Supabase (PostgreSQL + Supabase Storage) + Next.js Server Actions
* **Authentication:** Google OAuth via Supabase Auth
* **External Integration:** Google Sheets API v4 (`googleapis`) untuk otomatisasi *Append Row* data progress
* **Image Optimization:** `browser-image-compression` (Kompresi foto client-side dari HP owner sebelum ter-upload)
* **Deployment & CI/CD:** Vercel (Auto-deploy dari GitHub)

---

## 4. Functional Specifications & Requirements

### 4.1 Public / Customer Module

1. **Landing Page (`/`):**
* Form pencarian sederhana untuk memasukkan Kode ID Domba (misal: `KKY-8F3A2`).


2. **Progress Tracker Page (`/track/[trackingCode]`):**
* **Profile Header:** Foto utama domba, ID domba, ras, jenis kelamin, dan status badge (*Masa Penitipan / Terkirim*).
* **Metric Cards:** BB Awal (kg), BB Saat Ini (kg), Target BB Iduladha (kg), dan Selisih Kenaikan.
* **Countdown Banner:** Sisa hari menuju Hari Raya Iduladha.
* **Weight Growth Chart:** Grafik garis Recharts (Target Growth vs Actual Weight).
* **Progress Timeline Feed:** Feed kartu berisi riwayat update (Tanggal, Tipe Update, Status Kesehatan, Catatan Pakan/Fisik, dan Foto/Video Terbaru).
* **Action Bar:** Tombol *Salin Link Share* dan tombol *Chat Admin WA*.



### 4.2 Admin / Owner Module

1. **Authentication (`/login`):**
* Tombol *"Sign in with Google"* via Supabase OAuth.
* Proteksi route `/admin/*` via Middleware.


2. **Admin Dashboard (`/admin/dashboard`):**
* Metric Cards: Total Domba, Total Customer, Status Kesehatan.
* Tabel Master Domba + Fitur Pencarian ID/Nama Customer.
* Indikator status sinkronisasi Google Sheets.


3. **Form Tambah Domba (`/admin/sheep/new`):**
* Input data: ID Domba (Auto-generated / Custom), Nama Customer, No. WA, Ras, Jenis Kelamin, BB Awal, Target BB, Foto Awal.


4. **Form Input Progress (`/admin/sheep/[id]/progress`):**
* Pilihan Tipe Update: *Harian*, *Mingguan*, *Bulanan*.
* Input BB Terbaru (kg) + Dropdown Status Kesehatan + Catatan Textarea.
* Widget upload foto dari HP dengan kompresi otomatis.
* Action *Submit*: Trigger simpan ke Supabase & *Append Row* ke Google Sheets.



---

## 5. Database Schema (Supabase PostgreSQL)

```sql
-- 1. TABEL SHEEP
CREATE TABLE public.sheep (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    breed VARCHAR(50) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Jantan', 'Betina')),
    initial_weight NUMERIC(5,2) NOT NULL,
    target_weight NUMERIC(5,2) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Penitipan' CHECK (status IN ('Penitipan', 'Selesai/Terkirim', 'Terjual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sheep_tracking_code ON public.sheep(tracking_code);

-- 2. TABEL PROGRESS_LOGS
CREATE TABLE public.progress_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sheep_id UUID REFERENCES public.sheep(id) ON DELETE CASCADE,
    update_type VARCHAR(15) CHECK (update_type IN ('Harian', 'Mingguan', 'Bulanan')),
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_weight NUMERIC(5,2) NOT NULL,
    health_status VARCHAR(50) DEFAULT 'Sehat',
    notes TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_logs_sheep_id ON public.progress_logs(sheep_id);

```

---

# AGENT EXECUTION ROADMAP (TASK-BY-TASK FLOW)

Urutan tugas ini dirancang secara terarah (*step-by-step*) agar dapat dieksekusi langsung oleh AI Agent di Antigravity / GitHub.

```text
TASK 1: Environment & Database Setup
  │
  ├──► TASK 2: Core Layout & Authentication (Google OAuth)
  │      │
  │      ├──► TASK 3: Admin Dashboard & Add Sheep Form
  │      │      │
  │      │      ├──► TASK 4: Mobile Progress Form & Google Sheets Sync
  │      │      │      │
  │      │      │      └──► TASK 5: Customer Tracker Page & Recharts
  │      │      │             │
  │      │      │             └──► TASK 6: Optimization & Vercel Deploy

```

---

### TASK 1: Environment & Database Infrastructure

* **Branch Goal:** `feature/task-1-infra-db`
* **Sub-tasks for Agent:**
1. Inisialisasi proyek Next.js (App Router), TypeScript, Tailwind CSS, dan `shadcn/ui`.
2. Setup file `.env.example` dan `.env.local` untuk URL Supabase, Anon Key, Google OAuth Credentials, dan Spreadsheet ID.
3. Sediakan file `schema.sql` di folder `supabase/` sesuai DDL di atas.
4. Atur Supabase Client Helper di `@/lib/supabase/client.ts` dan `@/lib/supabase/server.ts`.


* **Definition of Done (DoD):** Proyek ter-build tanpa error dan koneksi Supabase terverifikasi.

---

### TASK 2: Authentication & Route Protection

* **Branch Goal:** `feature/task-2-auth`
* **Sub-tasks for Agent:**
1. Buat halaman `/login` dengan tombol *"Sign in with Google"* menggunakan Supabase OAuth.
2. Buat Next.js `middleware.ts` untuk memproteksi semua sub-route di `/admin/*`. Redirect ke `/login` jika unauthenticated.
3. Buat komponen Header Admin dengan profil pengguna dan tombol Logout.


* **Definition of Done (DoD):** Hanya user terautentikasi yang dapat mengakses rute `/admin/dashboard`.

---

### TASK 3: Admin Dashboard & Master Sheep Management

* **Branch Goal:** `feature/task-3-admin-master`
* **Sub-tasks for Agent:**
1. Buat tampilan `/admin/dashboard` berisi kartu statistik ringkas dan data table `sheep` menggunakan komponen `shadcn/ui`.
2. Buat form tambah domba baru di `/admin/sheep/new`.
3. Buat Server Action untuk memasukkan data domba baru ke tabel `sheep`.


* **Definition of Done (DoD):** Admin dapat membuat data domba baru dan melihatnya di daftar tabel dashboard.

---

### TASK 4: Mobile Progress Form & Google Sheets Integration

* **Branch Goal:** `feature/task-4-progress-sheets-sync`
* **Sub-tasks for Agent:**
1. Buat halaman form update progress di `/admin/sheep/[id]/progress` (dikembangkan mobile-first).
2. Pasang library `browser-image-compression` untuk kompresi foto sebelum upload ke Supabase Storage bucket `sheep-media`.
3. Buat utilitas Google Sheets API di `@/lib/google-sheets.ts` menggunakan `googleapis`.
4. Buat Server Action yang menyimpan log ke `progress_logs` sekaligus menambahkan baris baru (*append row*) ke Google Sheets secara paralel.


* **Definition of Done (DoD):** Submit form berhasil menyimpan log, meng-upload foto terkompresi, dan menambah baris data baru secara real-time di Google Sheets.

---

### TASK 5: Public Customer Tracker & Data Visualization

* **Branch Goal:** `feature/task-5-customer-tracker`
* **Sub-tasks for Agent:**
1. Buat Landing Page di `/` dengan input pencarian Kode ID Domba.
2. Buat dynamic route `/track/[code]/page.tsx` yang mengambil data `sheep` dan `progress_logs` dari Supabase berdasarkan `tracking_code`.
3. Pasang komponen `Recharts` untuk membuat grafik garis kenaikan BB (Target vs Aktual).
4. Susun UI Timeline Feed untuk menampilkan kartu foto progress dan catatan kesehatan.
5. Tambahkan tombol interaktif *Salin Link Share* dan *Chat Admin WA*.


* **Definition of Done (DoD):** Customer dapat membuka ID domba tanpa login dan melihat seluruh data perkembangan beserta grafiknya dengan lancar di HP.

---

### TASK 6: Testing, Polish & Production Deployment

* **Branch Goal:** `feature/task-6-deployment`
* **Sub-tasks for Agent:**
1. Tambahkan penanganan kondisi *Error / 404 State* jika ID domba tidak ditemukan.
2. Lakukan audit performa gambar (pastikan menggunakan `next/image`).
3. Hubungkan repository GitHub ke Vercel dan pastikan seluruh Environment Variable terpasang di Vercel Dashboard.


* **Definition of Done (DoD):** Aplikasi sukses ter-deploy di Vercel, *live* tanpa error, dan siap digunakan untuk uji coba langsung di kandang.

---