# 🏛️ SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION
**Project:** Kandang Kang Iky - Animal Tracker & Care Management System  
**Repository:** https://github.com/workhendry20-creator/kandangkangiky  
**Last Updated:** October 2026  

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

Aplikasi ini dibangun menggunakan pola **Hybrid Serverless & BaaS (Backend-as-a-Service)** dengan arsitektur **Next.js App Router** di lapisan aplikasi dan **Supabase PostgreSQL** sebagai database & storage utama.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                    │
│                                                                                 │
│   ┌───────────────────────────────────┐     ┌───────────────────────────────┐   │
│   │   Customer (Public Browser)       │     │    Owner / Admin (Mobile/PC)  │   │
│   │   URL: /track/[trackingCode]      │     │    URL: /admin/*              │   │
│   └─────────────────┬─────────────────┘     └───────────────┬───────────────┘   │
└─────────────────────┼───────────────────────────────────────┼───────────────────┘
                      │                                       │
                      │ (HTTP GET / Dynamic SSR)              │ (Google OAuth & Server Actions)
                      ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION LAYER                                │
│                         (Next.js App Router on Vercel)                          │
│                                                                                 │
│   ┌───────────────────────────────────┐     ┌───────────────────────────────┐   │
│   │      Public Server Components     │     │      Protected Middleware     │   │
│   │      & Recharts Renderer          │     │      & Server Actions         │   │
│   └─────────────────┬─────────────────┘     └───────────────┬───────────────┘   │
└─────────────────────┼───────────────────────────────────────┼───────────────────┘
                      │                                       │
                      │ (Read Only Query)                     │ (Read/Write & Storage Upload)
                      ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DATA & INTEGRATION LAYER (BaaS)                         │
│                                                                                 │
│   ┌───────────────────────────────────┐     ┌───────────────────────────────┐   │
│   │      Supabase PostgreSQL DB       │     │     Supabase Cloud Storage    │   │
│   │      (Tables: sheep, logs)        │     │     (Bucket: sheep-media)     │   │
│   └───────────────────────────────────┘     └───────────────────────────────┘   │
│                                                             ▲                   │
│                                                             │ (Append Row Sync) │
│                                             ┌───────────────┴───────────────┐   │
│                                             │      Google Sheets API v4     │   │
│                                             │      (Owner Google Sheet)     │   │
│                                             └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA FLOW & INTEGRATION PIPELINE

### A. Customer Access Flow (No Auth)

1. Customer membuka link `/track/KKY-8F3A2` atau memasukkan kode ID di homepage `/`.
2. Next.js Server Component melakukan *direct query* ke Supabase PostgreSQL berdasarkan `tracking_code`.
3. Supabase memvalidasi **Row Level Security (RLS)** publik (`TO anon, authenticated USING (true)`).
4. Server merender HTML berisi data profil domba, grafik **Recharts** (Target vs Actual BB), serta timeline feed foto perkembangan.

### B. Admin Input & Dual-Sync Pipeline

1. Owner menekan tombol **"Sign in with Google"** di `/admin/login`.
2. Supabase Auth menangani OAuth handshake dengan Google Cloud OAuth Provider.
3. Next.js `middleware.ts` memverifikasi sesi JWT admin untuk setiap akses rute `/admin/*`.
4. Saat owner submit form **Update Progress**:
   * **Client-Side:** Foto HP dikompresi di browser via `browser-image-compression` ke format WebP (~100KB - 300KB).
   * **Upload:** Foto di-upload ke Supabase Storage bucket `sheep-media`, mengembalikan `media_url`.
   * **Server Action Exec:** Server Action mengeksekusi 2 tugas secara paralel:
     1. Insert log baru ke tabel `progress_logs` di Supabase PostgreSQL.
     2. Panggil **Google Sheets API v4** (`googleapis`) menggunakan Service Account untuk menambahkan baris baru (*append row*) di Google Sheet milik owner.

---

## 3. PROJECT DIRECTORY STRUCTURE

```text
kandangkangiky/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                      # Landing Page & ID Search Bar
│   │   └── track/
│   │       └── [code]/
│   │           └── page.tsx              # Public Customer Tracker Page
│   ├── (admin)/
│   │   ├── login/
│   │   │   └── page.tsx                  # Google OAuth Login Page
│   │   └── admin/
│   │       ├── dashboard/
│   │       │   └── page.tsx              # Master Sheep Table & Stats Overview
│   │       └── sheep/
│   │           ├── new/
│   │           │   └── page.tsx          # Add New Sheep Form
│   │           └── [id]/
│   │               └── progress/
│   │                   └── page.tsx      # Mobile Update Progress Form
│   ├── api/                              # Optional REST API / Webhooks
│   ├── layout.tsx                        # Root Layout & Font Setup
│   └── globals.css                       # Tailwind Global Directives
├── components/
│   ├── ui/                               # shadcn/ui Primitive Components
│   ├── customer/
│   │   ├── WeightChart.tsx               # Recharts Line Graph
│   │   └── ProgressTimeline.tsx          # Photo & Log Feed Cards
│   └── admin/
│       ├── ImageCompressor.tsx           # Mobile Camera Upload Component
│       └── SheepTable.tsx                # Dashboard Master Data Table
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase Client
│   │   └── server.ts                     # SSR / Server Action Supabase Client
│   ├── google-sheets.ts                  # Google Sheets API Service Account Integration
│   └── utils.ts                          # Helper functions (cn, formatCurrency, etc.)
├── middleware.ts                         # Route Protection Middleware for /admin/*
├── schema.sql                            # Database Schema & RLS Policies
├── AGENT.md                              # AI Agent Execution Plan
├── ARCHITECTURE.md                       # System Architecture Document
└── .env.example                          # Environment Variables Template
```

---

## 4. DATABASE ENTITY RELATIONSHIP DIAGRAM (ERD)

```text
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│             public.sheep             │       │         public.progress_logs         │
├──────────────────────────────────────┤       ├──────────────────────────────────────┤
│ id (PK)                 : UUID       │   ┌───< sheep_id (FK)            : UUID       │
│ tracking_code (Unique)  : VARCHAR(20)│   │   │ id (PK)                  : UUID       │
│ customer_name           : VARCHAR(100│   │   │ update_type              : VARCHAR(15)│
│ customer_phone          : VARCHAR(20)│   │   │ record_date              : DATE       │
│ breed                   : VARCHAR(50)│   │   │ current_weight           : NUMERIC    │
│ gender                  : VARCHAR(10)│   │   │ health_status            : VARCHAR(50)│
│ initial_weight          : NUMERIC    │   │   │ notes                    : TEXT       │
│ target_weight           : NUMERIC    │   │   │ media_url                : TEXT       │
│ entry_date              : DATE       │   │   │ created_at               : TIMESTAMPTZ│
│ status                  : VARCHAR(20)│   │   └──────────────────────────────────────┘
│ created_at              : TIMESTAMPTZ│   │
└──────────────────────────────────────┴───┘
```

---

## 5. SECURITY & ENVIRONMENT VARIABLES

### A. Row Level Security (RLS) Strategy

* **`public.sheep` & `public.progress_logs`:**
  * `SELECT`: Terbuka untuk `anon` dan `authenticated` agar customer dapat mengakses data tracker tanpa login.
  * `INSERT` / `UPDATE` / `DELETE`: Terkunci rapat khusus untuk role `authenticated` (Admin yang login via Google OAuth).

### B. Environment Variables Reference

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Google Sheets API Integration
GOOGLE_SHEET_ID="your-spreadsheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="kandang-bot@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```