📘 Dokumen Arsitektur & Operasional Sistem — Kandang Kang Iky

Dokumen ini berisi analisis lengkap, akar masalah teknis, solusi arsitektur database, desain antarmuka pengguna (UI/UX), serta panduan eksekusi untuk pengisian log progress universal, manajemen kepemilikan domba, dan alur penjualan/penitipan domba.

📋 1. Ringkasan Eksekutif & Latar Belakang

Aplikasi Kandang Kang Iky mengelola dua area utama operasional peternakan:

Inventaris Kandang: Seluruh populasi domba di peternakan (Stok Sendiri/Internal, Pemacek, Indukan, Cempe, maupun Domba Titipan Mitra).

Titipan & Qurban: Layanan khusus untuk customer yang membeli atau menitipkan domba penggemukan, yang memerlukan pemantauan perkembangan bobot dan kesehatan secara berkala melalui portal publik.

🛑 Identifikasi Masalah Utama Sebelumnya:

Bentrok Kolom Status: Status biologis domba (Pemacek, Indukan, Menyusui, Cempe, Kosongan) sebelumnya bentrok dengan status penjualan/penitipan (Penitipan, Terjual), menyebabkan kegagalan perpindahan data saat aksi penjualan diklik.

Duplikasi Data: Pengisian log dan pemisahan data berisiko menciptakan data ganda antara Supabase dan Google Sheets jika tidak diatur dengan satu sumber kebenaran (Single Source of Truth).

Kebutuhan Log Progress Universal: Log perkembangan bobot dan kesehatan awalnya hanya tersedia untuk domba titipan, padahal domba aset internal kandang juga membutuhkan pencatatan rutin.

Alur Transisi Kepemilikan: Belum adanya alur langsung untuk mengubah domba stok kandang menjadi domba titipan customer saat terjadi transaksi penjualan di tempat.

🏗️ 2. Solusi Arsitektur & Mental Model Database

2.1 Struktur Tabel Supabase

Sistem menggunakan tiga tabel utama di Supabase:

┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       farm_sheep / sheep        │       │          sheep_sold             │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (UUID, PK)                   │       │ id (UUID, PK)                   │
│ tracking_code (VARCHAR, UNIQUE) │       │ original_sheep_id (UUID)        │
│ customer_name (VARCHAR, NULLABLE)──────┐│ tracking_code (VARCHAR)         │
│ customer_phone (VARCHAR)        │      │ customer_name (VARCHAR)         │
│ breed (VARCHAR)                 │      │ customer_phone (VARCHAR)        │
│ gender (VARCHAR)                │      │ final_weight (NUMERIC)          │
│ initial_weight (NUMERIC)        │      │ sold_date (DATE)                │
│ current_weight (NUMERIC)        │      └─────────────────────────────────┘
│ status (VARCHAR) [Biologis]     │
└─────────────────────────────────┘
                │
                │ 1 : N
                ▼
┌─────────────────────────────────┐
│          progress_logs          │
├─────────────────────────────────┤
│ id (UUID, PK)                   │
│ sheep_id (UUID, FK)             │
│ current_weight (NUMERIC)        │
│ health_status (VARCHAR)         │
│ notes (TEXT)                    │
│ media_url (TEXT)                │
└─────────────────────────────────┘


2.2 Aturan Pemisahan Data (Filter Logic)

Kolom status (Biologis): Murni digunakan untuk peran/kondisi fisik domba (Kosongan, Indukan, Pemacek, Menyusui, Cempe). Tidak lagi dicampur dengan status komersial.

Kepemilikan Domba:

customer_name IS NULL: Stok Kandang (Milik Internal Peternakan).

customer_name IS NOT NULL: Titipan Customer (Otomatis tampil di Halaman Titipan).

Halaman Inventaris: Mengambil seluruh data dari farm_sheep.

Halaman Titipan (Tab 1): Mengambil data dari farm_sheep WHERE customer_name IS NOT NULL.

Halaman Titipan (Tab 2 - Terjual): Mengambil data khusus dari tabel sheep_sold.

🔄 3. Alur Operasional & Transisi Data (Workflow)

                       [ + Tambah Domba Baru ]
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │ Apakah Customer Langsung Terisi?│
                 └────────────────┬────────────────┘
                        Ya        │        Tidak
           ┌──────────────────────┴──────────────────────┐
           ▼                                             ▼
  [ Titipan Customer ]                          [ Stok Kandang ]
  • Customer Name Terisi                        • Customer Name = NULL
  • Muncul di Inventaris                        • Muncul HANYA di Inventaris
  • Muncul di Halaman Titipan                   • Aksi: [ Assign Customer ]
           │                                             │
           │                                             │ (Ada Pembeli)
           │                                             ▼
           │                             [ Modal: Assign Customer ]
           │                             • Input WA & Nama Customer
           │                             • Updates `farm_sheep`
           └──────────────────────┬──────────────────────┘
                                  │
                                  ▼
                     [ + Input Log Progress ]
                     • Rekam BB & Kesehatan
                     • Insert to `progress_logs`
                     • Push to Sheet `Log_Titipan`
                                  │
                                  │ (Masa Penitipan Selesai / Terjual)
                                  ▼
              [ Tombol Merah: Selesaikan Masa Penitipan ]
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
1. COPY data ke `sheep_sold`                     2. DELETE dari `farm_sheep`
   • final_weight & sold_date                       • Hapus dari Master Aktiv
   • Simpan log penimbangan terakhir               • Hilang dari Tab 1
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  ▼
                      [ Pindah ke Tab 2 ]
                   (Domba Terjual / Selesai)


🎨 4. Spesifikasi Antarmuka Pengguna (UI/UX)

4.1 Tracking Code Format (KKY-XXXX)

Format: Auto-increment sequential 4 digit (KKY-0001, KKY-0002, ...).

Form Tambah Domba:

Menampilkan badge hijau rekomendasi otomatis ID berikutnya: ✓ Rekomendasi ID selanjutnya: KKY-0003.

Validasi Duplikat Real-time: Jika ketik manual dan kode sudah terdaftar, border input menjadi merah dengan badge peringatan ⚠️ Kode ID ini sudah terdaftar! serta menonaktifkan tombol submit.

4.2 Halaman Inventaris Kandang

Badge Kepemilikan:

🟢 Titipan Customer (Sertakan nama customer di bawahnya).

⚪ Stok Kandang (Tanda domba milik peternakan).

Kolom Aksi:

Jika Stok Kandang: Tampilkan tombol ramping Assign Customer dan + Log Progress.

Jika Titipan Customer: Tampilkan tombol + Log Progress dan tombol Edit/Delete.

4.3 Form Log Progress Universal

Header Modal Form:

Jika ada customer: [KKY-0001] • Customer: Hendry Bambang.

Jika stok kandang: [CMP-DK267-1] • Stok Kandang (Milik Peternakan).

Tombol Merah Selesaikan Masa Penitipan:

Ukuran Full-Width (w-full) memanjang horizontal secara mandiri.

Terletak tepat di bawah section upload FOTO DOMBA TERKINI.

Warna: Red Dark / Rose Dark (bg-rose-900 / #881337) dengan teks putih terang.

Di atas grup footer aksi (Batal & Simpan Perkembangan).

⚡ 5. Optimasi Performa & Caching Strategy

Route Prefetching: Seluruh navigasi internal menggunakan <Link prefetch={true}> untuk instant page load.

Dynamic Import: Komponen modal berat (LogProgressForm, AssignCustomerModal, DetailModal) dimuat via next/dynamic ({ ssr: false }).

Tab Caching: Tab 1 dan Tab 2 dibungkus SWR/React Query (keepPreviousData: true) untuk perpindahan tab tanpa delay/loading spinner.

Image Compression: Foto domba dikompresi otomatis ke format WebP (< 800 KB) sebelum diunggah ke Supabase Storage.

🛠️ 6. Check-List Audit Sebelum Go-Live

[ ] ID Generator: Pendaftaran domba baru menghasilkan kode urut KKY-XXXX yang valid.

[ ] Duplicate Guard: Pengetikan kode unik duplikat berhasil memicu indikator merah & memblokir submit.

[ ] Assign Flow: Domba dari Inventaris berhasil di-assign customer dan otomatis muncul di Halaman Titipan.

[ ] Universal Log: Domba stok kandang dan titipan sama-sama berhasil menyimpan log progress ke Supabase dan Google Sheets.

[ ] Red Button Action: Klik tombol merah "Selesaikan Masa Penitipan" berhasil memindahkan baris data ke sheep_sold, menghapus dari farm_sheep, dan memperbarui Tab 2 tanpa merusak Google Sheets.

[ ] Git Push: Seluruh perubahan telah di-commit dan di-push ke branch utama (main).

Dokumen ini dibuat secara otomatis sebagai standar arsitektur resmi aplikasi Kandang Kang Iky.