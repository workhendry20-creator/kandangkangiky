Berikut adalah draf file **`AGENT.md`** yang sudah disusun rapi, terstruktur, dan disesuaikan khusus untuk AI Agent (seperti Antigravity, Cursor, atau Copilot Workspace).

File ini berisi panduan *project context*, aturan koding, arsitektur, hingga instruksi *task-by-task execution* agar Agent dapat mengeksekusi kode dengan presisi tanpa melenceng.

---

### 📄 Salin seluruh teks di bawah ini dan simpan sebagai `AGENT.md` di root repository GitHub milikmu (`kandangkangiky/AGENT.md`):

```markdown
# 🤖 AGENT INSTRUCTIONS & PROJECT GUIDELINES
**Project:** Kandang Kang Iky - Livestock Progress Tracker & Care Management System  
**Repository:** https://github.com/workhendry20-creator/kandangkangiky  
**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Storage), Google OAuth, Google Sheets API v4, Recharts.

---

## 🎯 PROJECT OVERVIEW
Kandang Kang Iky is a livestock startup specializing in sheep sales and long-term care management (until Iduladha). This application automates sheep progress reporting. 

- **Public Access (No Auth):** Customers track sheep progress via unique ID (`/track/[trackingCode]`).
- **Admin Access (Google OAuth):** Owner/Admin manages sheep master data, updates progress logs from mobile, and syncs data to Google Sheets (`/admin/*`).

---

## 🛠️ CODING RULES & CONVENTIONS

1. **Framework & Language:**
   - Use Next.js 14+ with App Router and TypeScript.
   - Strictly use `'use client'` directive only when client-side interactivity/state is required.
   - Prefer Server Components and Server Actions for data fetching and mutations.

2. **Styling & UI:**
   - Use Tailwind CSS and `shadcn/ui` components for clean, modern, and accessible design.
   - Primary Theme Palette: Emerald Green (`emerald-600`), Slate Text (`slate-800`), Cream/White background.
   - Mobile-First Approach for form inputs and timeline feeds.

3. **Database & API:**
   - Use `@supabase/ssr` or `@supabase/supabase-js` for Supabase integrations.
   - Store all environment variables in `.env.local` (referenced via `.env.example`).
   - NEVER hardcode secrets, API keys, or private keys in code.

4. **Git Workflow:**
   - Always create a dedicated feature branch for each task (e.g., `feature/task-1-auth`).
   - Write clear, imperative commit messages (e.g., `feat: setup supabase client and google oauth login`).

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

### [TASK 1] Infra, Auth & Protection

* **Branch:** `feature/task-1-auth`
* **Scope:**
1. Initialize Next.js App Router, TypeScript, Tailwind CSS, Lucide Icons, and shadcn/ui.
2. Create `.env.example` file.
3. Set up Supabase Client Helper at `@/lib/supabase/client.ts` and `@/lib/supabase/server.ts`.
4. Create Login Page at `app/(admin)/login/page.tsx` with Google OAuth button via Supabase Auth.
5. Set up `middleware.ts` to protect `/admin/*` routes.
6. Create skeleton dashboard page at `app/(admin)/dashboard/page.tsx` with user email & logout button.



### [TASK 2] Admin Dashboard & Master Sheep Management

* **Branch:** `feature/task-2-admin-master`
* **Scope:**
1. Build `/admin/dashboard` table view listing all sheep records from Supabase.
2. Build `/admin/sheep/new` page with a form to add a new sheep (Generating unique `tracking_code`).
3. Implement Server Action to insert sheep data into Supabase `sheep` table.



### [TASK 3] Mobile Progress Form & Google Sheets Sync

* **Branch:** `feature/task-3-progress-sheets-sync`
* **Scope:**
1. Create mobile-friendly form at `app/(admin)/sheep/[id]/progress/page.tsx`.
2. Add image compression using `browser-image-compression` before uploading photos to Supabase Storage bucket `sheep-media`.
3. Create Google Sheets API client at `@/lib/google-sheets.ts` using `googleapis`.
4. Create Server Action to save log into `progress_logs` and append a row into Google Sheets simultaneously.



### [TASK 4] Public Customer Tracker & Recharts

* **Branch:** `feature/task-4-customer-tracker`
* **Scope:**
1. Create Landing Page at `app/(public)/page.tsx` with a search bar for `tracking_code`.
2. Create Dynamic Route `app/(public)/track/[code]/page.tsx` fetching data by `tracking_code`.
3. Display Metric Cards (Initial Weight, Current Weight, Target Weight, Countdown to Iduladha).
4. Implement `Recharts` line chart (Target Growth vs Actual Weight).
5. Build Progress Timeline Feed showing photo cards, health status, and notes.
6. Add CTA buttons: "Copy Share Link" & "Chat Admin WhatsApp".



### [TASK 5] Error Handling, Polish & Vercel Prep

* **Branch:** `feature/task-5-polish-deploy`
* **Scope:**
1. Handle 404 / Empty States for invalid tracking codes.
2. Optimize image rendering with `next/image`.
3. Verify production build (`npm run build`).



```
