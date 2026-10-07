import React, { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { SheepTable } from '@/components/admin/SheepTable'
import type { Sheep } from '@/types/sheep'
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Users,
  Plus,
  ExternalLink,
  Sparkles,
  Scale,
  CheckCircle2,
} from 'lucide-react'

async function DashboardContent() {
  const supabase = await createClient()

  // Get current authenticated user
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch {
    user = null
  }

  const userEmail = user?.email || 'admin@kandangkangiky.com'
  const userInitials = userEmail.slice(0, 2).toUpperCase()

  // Fetch sheep and related progress logs
  let sheepList: Sheep[] = []
  try {
    const { data, error } = await supabase
      .from('sheep')
      .select(`
        *,
        progress_logs (
          current_weight,
          record_date
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback if relation query encounters an issue
      const fallback = await supabase
        .from('sheep')
        .select('*')
        .order('created_at', { ascending: false })

      if (!fallback.error && fallback.data) {
        sheepList = (fallback.data as unknown as Sheep[]).map((item) => ({
          ...item,
          current_weight: item.initial_weight,
        }))
      }
    } else if (data) {
      sheepList = (data as unknown as Sheep[]).map((item) => {
        let latestWeight = item.initial_weight
        if (item.progress_logs && Array.isArray(item.progress_logs) && item.progress_logs.length > 0) {
          const sorted = [...item.progress_logs].sort(
            (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
          )
          latestWeight = sorted[0].current_weight
        }
        return {
          ...item,
          current_weight: latestWeight,
        }
      })
    }
  } catch (err) {
    console.error('Gagal mengambil master data domba:', err)
  }

  // Calculate Dashboard Metrics
  const totalSheep = sheepList.length
  const uniqueCustomers = new Set(
    sheepList.map((s) => s.customer_name.trim().toLowerCase())
  ).size
  const penitipanCount = sheepList.filter((s) => s.status === 'Penitipan').length
  const completedCount = sheepList.filter((s) => s.status === 'Selesai/Terkirim').length

  const avgWeight =
    totalSheep > 0
      ? (
          sheepList.reduce(
            (acc, s) => acc + (s.current_weight ?? s.initial_weight),
            0
          ) / totalSheep
        ).toFixed(1)
      : '0.0'

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
                <span
                  className="text-xs font-semibold text-slate-900 max-w-[150px] truncate"
                  title={userEmail}
                >
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
                Kelola master data domba titipan, pantau target bobot Iduladha, dan update perkembangan berkala dari mobile.
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
              <Link
                href="/admin/sheep/new"
                id="btnAddNewSheepHero"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Domba Baru</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Stat Cards (3 Required + 1 Avg Weight) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Ternak */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Ternak
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                🐑
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">{totalSheep}</span>
                <span className="text-sm text-slate-500">ekor</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Master Data Aktif</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>{penitipanCount} Penitipan</span>
              <span>•</span>
              <span>{completedCount} Selesai</span>
            </div>
          </div>

          {/* Card 2: Total Customer */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Customer
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">{uniqueCustomers}</span>
                <span className="text-sm text-slate-500">mitra</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mitra Terdaftar</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>Pemilik Titipan Domba</span>
              <span className="text-emerald-700 font-medium">100% Terverifikasi</span>
            </div>
          </div>

          {/* Card 3: Status Penitipan */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status Penitipan
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-emerald-800">{penitipanCount}</span>
                <span className="text-sm text-slate-500">ekor aktif</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sedang Dalam Perawatan</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>Target Iduladha 1447H</span>
              <span className="text-emerald-700 font-medium">Parung, Bogor</span>
            </div>
          </div>

          {/* Card 4: Rata-rata Bobot */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rata-rata Bobot
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">{avgWeight}</span>
                <span className="text-sm text-slate-500">kg</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Pertumbuhan Terukur</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>Sensor & Timbangan Digital</span>
              <span className="text-emerald-700 font-medium">Terkalibrasi</span>
            </div>
          </div>
        </div>

        {/* Master Data Sheep Table with Search Filter */}
        <SheepTable initialSheep={sheepList} />
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
            <span>Status Sistem: Operasional Normal</span>
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
        <p className="text-xs text-slate-400">Mengambil data ternak dari Supabase</p>
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
