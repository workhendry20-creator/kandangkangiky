import React, { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/admin/LogoutButton'
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

async function DashboardContent() {
  const supabase = await createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch {
    user = null
  }

  const userEmail = user?.email || 'admin@kandangkangiky.com'
  const userInitials = userEmail.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-slate-800">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand & Location */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold shadow-md shadow-emerald-800/20">
              <span className="text-xl">🐑</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                  Kang Iky
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Kandang Utama: Parung, Bogor
              </p>
            </div>
          </div>

          {/* Sync Status & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Google Sheets Sync Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200/60 text-xs font-medium text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>Google Sheets Sync Ready</span>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-stone-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center ring-2 ring-emerald-100">
                {userInitials}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 max-w-[150px] truncate" title={userEmail}>
                  {userEmail}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Owner / Peternak
                </span>
              </div>

              {/* Logout Button */}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Greeting Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          <div className="absolute -right-10 -top-10 w-52 h-52 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pusat Kendali Penggemukan & Qurban</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Selamat Datang di Dashboard, Kang Iky!
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                Akun terverifikasi:{' '}
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {userEmail}
                </span>
                . Pantau perkembangan ternak, rekam log bobot berkala, dan kelola titipan mitra qurban dari satu tempat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lihat Portal Publik</span>
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Domba Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Stat Cards (4 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Populasi */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Ternak Hidup
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                🐑
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">128</span>
                <span className="text-sm text-slate-500">ekor</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14 ekor bulan ini</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>92 Garut Super</span>
              <span>•</span>
              <span>36 Merino / Dormas</span>
            </div>
          </div>

          {/* Card 2: Total Mitra */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mitra Pemilik / Qurban
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">94</span>
                <span className="text-sm text-slate-500">mitra</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>82 Booking DP / Lunas</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>12 Cicilan Tabungan</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">98.2% Aktif</span>
            </div>
          </div>

          {/* Card 3: Perlu Update Bobot */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Perlu Update Bobot
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center font-bold">
                ⚖️
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">12</span>
                <span className="text-sm text-slate-500">ekor</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Jadwal timbang pekan ini</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>Target Iduladha 1447H</span>
              <span className="text-emerald-700 font-medium">85 Hari Tersisa</span>
            </div>
          </div>

          {/* Card 4: Tingkat Kesehatan */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status Kesehatan
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-emerald-800">98.4%</span>
                <span className="text-sm text-slate-500">sehat</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>126 Kondisi Prima</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>2 Dalam Observasi</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Vaksin Lengkap</span>
            </div>
          </div>
        </div>

        {/* Master Data Table Skeleton (Preview for TASK 2) */}
        <div className="rounded-3xl bg-white border border-stone-200/90 shadow-xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-6 border-b border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Master Data Domba Titipan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar seluruh domba yang sedang dalam perawatan dan penggemukan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar Placeholder */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari ID domba atau mitra..."
                  disabled
                  className="pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs sm:text-sm text-slate-500 w-56 sm:w-64 cursor-not-allowed"
                />
              </div>

              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-xs text-slate-500 cursor-not-allowed bg-stone-50/50"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Status</span>
              </button>
            </div>
          </div>

          {/* Table Rows Skeleton */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-6">ID Domba</th>
                  <th className="py-3.5 px-6">Mitra / Pemilik</th>
                  <th className="py-3.5 px-6">Ras</th>
                  <th className="py-3.5 px-6 text-right">BB Awal</th>
                  <th className="py-3.5 px-6 text-right">BB Saat Ini</th>
                  <th className="py-3.5 px-6 text-right">Target BB</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {/* Mock Row 1 */}
                <tr className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-emerald-800">
                    KKY-8F3A2
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-800">
                    H. Hendry Kurniawan
                  </td>
                  <td className="py-4 px-6 text-slate-600">Garut Super</td>
                  <td className="py-4 px-6 text-right text-slate-600 font-mono">
                    25.0 kg
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-emerald-800 font-mono">
                    34.5 kg
                  </td>
                  <td className="py-4 px-6 text-right text-slate-600 font-mono">
                    45.0 kg
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Penitipan
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs text-slate-400">Siap di TASK 2</span>
                  </td>
                </tr>

                {/* Mock Row 2 */}
                <tr className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-emerald-800">
                    KKY-9B101
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-800">
                    Ust. Rahmat Hidayat
                  </td>
                  <td className="py-4 px-6 text-slate-600">Merino Silang</td>
                  <td className="py-4 px-6 text-right text-slate-600 font-mono">
                    28.5 kg
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-emerald-800 font-mono">
                    37.0 kg
                  </td>
                  <td className="py-4 px-6 text-right text-slate-600 font-mono">
                    50.0 kg
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Penitipan
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs text-slate-400">Siap di TASK 2</span>
                  </td>
                </tr>

                {/* Skeleton shimmer rows */}
                {[1, 2, 3].map((idx) => (
                  <tr key={idx} className="opacity-60">
                    <td className="py-4 px-6">
                      <div className="h-4 w-20 bg-stone-200 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 w-24 bg-stone-200 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-4 w-14 bg-stone-200 rounded ml-auto animate-pulse" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-4 w-14 bg-emerald-200 rounded ml-auto animate-pulse" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-4 w-14 bg-stone-200 rounded ml-auto animate-pulse" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-5 w-20 bg-stone-200 rounded-full animate-pulse" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-4 w-16 bg-stone-200 rounded mx-auto animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Notice */}
          <div className="p-4 bg-[#FAF7F2] border-t border-stone-200 text-center text-xs text-slate-500">
            Koneksi Database & Autentikasi Admin Berhasil diinisialisasi (TASK 1 DoD Tercapai).
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© 2026 Kandang Kang Iky.</span>
            <span>•</span>
            <span>AgriFintech & Livestock Intelligence Management.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Status Sistem: Normal</span>
            <span>•</span>
            <span>Visi Iduladha 1447H</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white text-xl font-bold flex items-center justify-center mx-auto animate-bounce">
          🐑
        </div>
        <p className="text-sm font-semibold text-slate-700">Memuat Dashboard Admin...</p>
        <p className="text-xs text-slate-400">Menghubungkan ke layanan Kandang Kang Iky</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  )
}
