# 🎨 SYSTEM_DESIGN.md - UI/UX DESIGN SYSTEM & COMPONENT BLUEPRINT
**Project:** Kandang Kang Iky - Animal Tracker & Care Management System  
**Design Source:** Google Stitch Export (`stitch_kandang_kang_iky_tracker`)  
**Design Theme:** AgriFintech & Livestock Intelligence Modern UI  

---

Ambil design system dari folder design_system

## 1. COLOR PALETTE & TYPOGRAPHY

### A. Primary Color Tokens
- **Primary Emerald (Brand):** `#065F46` / `emerald-800` (Digunakan untuk Primary Buttons, Headers, Navigation Badges, & Line Chart).
- **Secondary Sage (Accent):** `#10B981` / `emerald-500` (Digunakan untuk Active Badges, Positive Metrics, & Checkmarks).
- **Background Surface:** `#FDFBF7` / `stone-50` / `amber-50/20` (Warm Cream Background untuk rasa alami/organik).
- **Card Background:** `#FFFFFF` (Pure White dengan soft shadow `shadow-sm` dan border `border-emerald-100`).
- **Text Primary:** `#1E293B` / `slate-800` (Main text, titles, weights).
- **Text Muted:** `#64748B` / `slate-500` (Labels, subtitles, dates).

### B. Typography
- **Font Family:** Inter / Plus Jakarta Sans (Clean Sans-Serif).
- **Display Weights:**
  - Metric Numbers: `font-bold text-3xl text-slate-800`
  - Card Titles: `font-semibold text-lg text-slate-800`
  - Subtitles / Badges: `font-medium text-xs text-slate-500`

---

## 2. SCREEN-BY-SCREEN UI LAYOUT & COMPONENT BLUEPRINT

### SCREEN 1: Landing Page / Beranda Lacak Domba (`/`)
- **Hero Banner:**
  - Headline: "Pantau Perkembangan Domba Titipan Anda Secara Real-Time" (`text-3xl font-bold text-slate-900`).
  - Subheadline: "Transparan, Terukur, dan Terawat Hingga Hari Raya Iduladha."
- **Central Search Box:**
  - Floating card dengan shadow lembut (`shadow-md bg-white rounded-2xl p-4`).
  - Input Field: "Masukkan Kode ID Domba (Contoh: KKY-8F3A2)".
  - Button Primary: "Lacak Domba" (`bg-emerald-800 text-white rounded-xl px-6 py-3`).
- **Showcase Cards Grid:**
  - Banner foto domba dengan badge status floating "Tersertifikasi Sehat".
  - Feature highlights: "Standar Baru Perawatan dalam Kandang" (Monitoring Bobot, Pakan Terukur, Rekam Medis).

---

### SCREEN 2: Customer Progress Dashboard (`/track/[trackingCode]`)
- **Top Header:** Logo 'Kandang Kang Iky', Search Bar ringkas, dan Badge 'Masa Penitipan' (Green pulse dot).
- **Sheep Profile Hero Card:**
  - Kiri: Frame Foto Utama Domba (Rounded `rounded-2xl`).
  - Kanan: Title "Domba Garut Super #KKY-8F3A2", Subtitle Nama Owner/Penitip, Ras, Tanggal Masuk, dan Status Kesehatan ("Sangat Sehat").
- **Metrics Grid (3 Cards):**
  - **BB Awal:** `25.0 kg` (Label: Saat Masuk Kandang).
  - **BB Saat Ini:** `34.5 kg` (`+9.5 kg` dalam badge hijau).
  - **Target BB:** `45.0 kg` (Label: Target Iduladha 1447H).
- **Countdown Banner Card:**
  - Card berwarna Emerald (`bg-emerald-900 text-white rounded-2xl p-4`).
  - Teks: "85 Hari Menuju Iduladha 1447H" + Mini Progress Bar kenaikan bobot (76% toward target).
- **Growth Chart Section:**
  - Title: "Grafik Perkembangan Berat Badan (kg)".
  - Library: **Recharts Line Chart**.
  - Garis 1 (Dashed Gray): Target Growth Curve.
  - Garis 2 (Solid Emerald Green): Actual Weight Growth Curve.
- **Progress Timeline Feed (Cards Feed):**
  - Vertikal timeline dengan node hijau.
  - **Card Feed:** Badge Tipe Update (`Mingguan` / `Vaksinasi`), Tanggal Update, Angka BB Terbaru, Status Kesehatan, Catatan Pakan/Fisik, dan Galeri Foto Progress.
- **Bottom CTA Bar:**
  - Floating/Sticky Bar: Button "Salin Link Progress" (Outline) + Button "Chat Admin via WhatsApp" (Solid Emerald).

---

### SCREEN 3: Admin Dashboard Overview (`/admin/dashboard`)
- **Top Bar:** Greeting "Selamat Datang, Kang Iky!", Profile Avatar, Badge "Google Sheets Synced", and Logout Button.
- **Stat Cards Row (4 Columns):**
  1. Total Domba: `128`
  2. Total Customer: `94`
  3. Perlu Update Hari Ini: `12`
  4. Tingkat Kesehatan: `98.4%`
- **Main Action Bar:**
  - Search Bar (Cari ID Domba / Customer).
  - Filter Dropdown Status (`Penitipan`, `Terkirim`, `Perlu Attention`).
  - Primary Button: `+ Tambah Domba Baru` (`bg-emerald-800`).
- **Data Table (`shadcn/ui Table`):**
  - Columns: ID Domba (Link clickable), Nama Customer, Ras, BB Awal, BB Saat Ini, Target BB, Update Terakhir, Action (`+ Log Progress`).

---

### SCREEN 4: Mobile Form Input Progress Admin (`/admin/sheep/[id]/progress`)
- **Container:** Mobile-optimized centered card container.
- **Header:** Back Arrow, Title "Input Progress Domba #KKY-8F3A2".
- **Form Controls:**
  1. **Update Type:** Segmented Radio Toggle `[ Harian | Mingguan | Bulanan ]`.
  2. **Current Weight Input:** Large Number Input `34.5 kg` dengan tombol Quick Increment `+0.5` / `-0.5`.
  3. **Health Status Select:** Dropdown Options `[ Sehat & Fit | Dalam Perawatan | Perlu Perhatian ]`.
  4. **Catatan Pakan & Kondisi:** Textarea placeholder "Tulis catatan pakan, obat/vitamin, atau kondisi fisik...".
  5. **Media Upload Box:** Drag & Drop / Camera Upload Box dengan badge auto-compression WebP.
- **Submit CTA Button:**
  - Large Full-Width Button: **"Simpan & Sync ke Google Sheets"** (`bg-emerald-800 text-white py-4 rounded-xl font-semibold`).

---

## 3. UI COMPONENT IMPLEMENTATION MAPPING

| Stitch UI Element | React / Tailwind Implementation |
| :--- | :--- |
| Metric Stat Card | `components/ui/card.tsx` + `text-3xl font-bold text-slate-800` |
| Growth Chart | `Recharts` (`ResponsiveContainer`, `LineChart`, `XAxis`, `YAxis`, `Tooltip`) |
| Timeline Feed | `components/customer/ProgressTimeline.tsx` |
| Admin Data Table | `components/ui/table.tsx` dengan pagination & search filter |
| Upload Box | `components/admin/ImageCompressor.tsx` + `browser-image-compression` |