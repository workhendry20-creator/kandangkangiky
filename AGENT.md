
# 🤖 AGENT INSTRUCTIONS & PROJECT GUIDELINES
**Project:** Kandang Kang Iky - Livestock Progress Tracker & Care Management System  
**Repository:** https://github.com/workhendry20-creator/kandangkangiky  
**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Storage), Google Sheets API v4, Recharts.

---

## 🎯 PROJECT OVERVIEW
Kandang Kang Iky is a livestock startup specializing in sheep sales and long-term care management (until Iduladha). This application automates sheep progress reporting. 

- **Public Access (No Auth):** Customers track sheep progress via unique ID (`/track/[trackingCode]`).
- **Admin Access (Supabase Email & Password Auth):** Owner/Admin manages sheep master data, updates progress logs from mobile, and syncs data to Google Sheets (`/admin/*`).

---

## 🛠️ CODING RULES & CONVENTIONS

1. **Framework & Language:**
   - Use Next.js 15 App Router and TypeScript.
   - Strictly use `'use client'` directive only when client-side interactivity/state is required.
   - For dynamic admin pages fetching real-time data or using dates, declare `export const dynamic = 'force-dynamic'` at top level.
   - Prefer Server Components and Server Actions for data fetching and mutations.

2. **Styling & UI:**
   - Use Tailwind CSS and `shadcn/ui` components for clean, modern, and accessible design.
   - Primary Theme Palette: Emerald Green (`emerald-800`), Slate Text (`slate-800`), Cream/White background (`bg-[#FDFBF7]`).
   - Refer to `SYSTEM_DESIGN.md` for full design tokens and layout specifications.
   - Mobile-First Approach for form inputs and timeline feeds.

3. **Database & API:**
   - Use `@supabase/ssr` and `@supabase/supabase-js` for Supabase integrations.
   - Store all environment variables in `.env.local` (referenced via `.env.example`).
   - NEVER hardcode secrets, API keys, or private keys in code.

4. **Git Workflow:**
   - Always create a dedicated feature branch for each task (e.g., `feature/task-2-admin-master`).
   - Write clear, imperative commit messages (e.g., `feat: build admin dashboard table and new sheep form`).

---

## 📊 DATABASE SCHEMA REFERENCE (SUPABASE)

```sql
-- 1. SHEEP TABLE
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

-- 2. PROGRESS LOGS TABLE
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

```

---

## 🚀 TASK-BY-TASK EXECUTION PLAN

### [TASK 1] Infra, Auth & Protection - ✅ COMPLETED
* **Branch:** `feature/task-1-auth`
* **Status:** Selesai (Completed & Merged)
* **Scope:**
1. Install `@supabase/supabase-js` dan `@supabase/ssr`.
2. Create `.env.example` file dengan variabel Supabase.
3. Supabase Client Helper di `@/lib/supabase/client.ts` dan `@/lib/supabase/server.ts`.
4. Admin Login Page di `app/admin/login/page.tsx` dengan Email & Password form.
5. Next.js `proxy.ts` (middleware) untuk proteksi route `/admin/*`.
6. Skeleton dashboard page di `app/admin/dashboard/page.tsx` dengan user info & logout.

### [TASK 2] Admin Dashboard & Master Sheep Management - ✅ COMPLETED
* **Branch:** `feature/task-2-admin-master`
* **Status:** Selesai (Completed)
* **Scope:**
1. Fix Next.js prerender issue dengan `export const dynamic = 'force-dynamic'` di `app/admin/dashboard/page.tsx`.
2. Dashboard table view listing seluruh domba dari Supabase `sheep` table dengan kartu KPI & live search filter.
3. Halaman `app/admin/sheep/new/page.tsx` dengan form responsif (auto-generating unique `tracking_code` format `KKY-XXXXX`).
4. Server Action di `@/lib/actions/sheep.ts` untuk insert data domba ke Supabase.

### [TASK 3] Mobile Progress Form & Google Sheets Sync - ✅ COMPLETED
* **Branch:** `feature/task-3-progress-sheets-sync`
* **Status:** Selesai (Completed)
* **Scope:**
1. Form mobile-friendly di `app/admin/sheep/[id]/progress/page.tsx` & `components/admin/ProgressForm.tsx`.
2. Kompresi gambar via `browser-image-compression` sebelum upload ke bucket `sheep-media`.
3. Google Sheets API client di `@/lib/google-sheets.ts` menggunakan `googleapis` Service Account & Apps Script Webhook fallback.
4. Server Action di `@/lib/actions/progress.ts` untuk simpan ke `progress_logs` dan sync data ke Google Sheets simultan.

### [TASK 4] Public Customer Tracker & Recharts - ✅ COMPLETED
* **Branch:** `feature/task-4-customer-tracker`
* **Status:** Selesai (Completed)
* **Scope:**
1. Landing Page publik di `app/page.tsx` dengan input search `tracking_code`.
2. Dynamic Route `app/track/[code]/page.tsx` fetching data domba & progress logs dari Supabase.
3. Metric Cards (Pemilik, Ras/Gender, BB Awal, BB Saat Ini, Target BB, Countdown Iduladha).
4. Grafik pertumbuhan Recharts (`components/tracker/WeightChart.tsx`).
5. Timeline Progress Feed (`components/tracker/ProgressFeed.tsx`) dengan preview foto modal & status kesehatan.
6. CTA buttons: "Salin Link Bagikan" & "Chat Admin WhatsApp".

### [TASK 5] Error Handling, Polish & Vercel Prep - ✅ COMPLETED
* **Branch:** `feature/task-5-polish-deploy`
* **Status:** Selesai (Completed)
* **Scope:**
1. Google Apps Script Webhook sync integration di `@/lib/google-sheets.ts` dan `@/lib/actions/progress.ts`.
2. Penanganan 404 / Invalid Tracking Code di `app/track/[code]/page.tsx` dengan UI yang rapi.
3. Optimalisasi rendering `next/image` dengan atribut `sizes`, `priority`, dan Supabase storage domain.
4. Verifikasi production build (`npm run lint` & `npm run build` lolos 0 error).

