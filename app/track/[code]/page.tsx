export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { Suspense } from 'react'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { WeightChart } from '@/components/tracker/WeightChart'
import { ProgressFeed } from '@/components/tracker/ProgressFeed'
import { TrackerActions } from '@/components/tracker/TrackerActions'
import { CountdownCard } from '@/components/tracker/CountdownCard'
import { formatWeight, formatDate } from '@/lib/utils'
import type { Sheep, ProgressLog } from '@/types/sheep'
import {
  ArrowLeft,
  Scale,
  Sparkles,
  TrendingUp,
  Search,
} from 'lucide-react'

interface PageProps {
  params: Promise<{
    code: string
  }>
}

async function TrackerContent({ params }: PageProps) {
  const { code } = await params
  const trackingCode = decodeURIComponent(code).trim().toUpperCase()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('sheep')
    .select(`
      *,
      progress_logs (
        id,
        sheep_id,
        update_type,
        record_date,
        current_weight,
        health_status,
        notes,
        media_url,
        created_at
      )
    `)
    .eq('tracking_code', trackingCode)
    .order('record_date', { referencedTable: 'progress_logs', ascending: false })
    .order('created_at', { referencedTable: 'progress_logs', ascending: false })
    .single()

  if (error) {
    console.error(`[Tracking] Error fetching sheep for code "${trackingCode}":`, error)
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-slate-800">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors p-2 -ml-2 rounded-xl hover:bg-stone-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pencarian</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xl">🐑</span>
              <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Kandang Kang Iky
              </span>
            </div>
          </div>
        </header>

        {/* 404 Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-800 text-3xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm animate-pulse">
            🔍
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
              Data Tidak Ada
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kode Tracking Tidak Ditemukan
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Kode tracking <span className="font-mono font-bold text-emerald-800 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">&ldquo;{trackingCode}&rdquo;</span> tidak terdaftar di sistem Kandang Kang Iky. Pastikan Anda memasukkan kode yang sesuai dari kwitansi atau pesan tim kami.
            </p>
          </div>

          <div className="pt-2 w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Kembali ke Halaman Pencarian</span>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const sheep = data as Sheep
  const rawLogs = ((data.progress_logs || []) as ProgressLog[]).sort((a, b) => {
    const dateDiff =
      new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    if (dateDiff !== 0) return dateDiff
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
    return bCreated - aCreated
  })

  // Hitung akumulasi BB Saat Ini: initial_weight + TOTAL(current_weight dari seluruh progress_logs)
  const initialWeight = Number(sheep.initial_weight) || 0
  const totalLogsGain = rawLogs.reduce(
    (sum, log) => sum + (Number(log.current_weight) || 0),
    0
  )
  const currentWeight =
    rawLogs.length > 0
      ? Math.round((initialWeight + totalLogsGain) * 100) / 100
      : sheep.current_weight !== undefined && sheep.current_weight !== null
      ? Number(sheep.current_weight)
      : initialWeight

  const weightGain = Math.round((currentWeight - initialWeight) * 100) / 100

  // Calculate Progress towards Target Weight
  const totalTargetGain = sheep.target_weight - sheep.initial_weight
  const progressPercent =
    totalTargetGain > 0
      ? Math.min(100, Math.max(0, Math.round((weightGain / totalTargetGain) * 100)))
      : 100

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors p-2 -ml-2 rounded-xl hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda Lacak</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xl">🐑</span>
            <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Kandang Kang Iky
            </span>
          </div>

          <Link
            href="/admin/login"
            className="text-xs font-semibold text-emerald-800 hover:underline px-2.5 py-1.5 rounded-lg hover:bg-emerald-50"
          >
            Masuk Admin
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Sheep Hero Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-xs">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {sheep.tracking_code}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Status: {sheep.status}</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-slate-600">
                  Masuk: {formatDate(sheep.entry_date)}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Domba {sheep.breed} #{sheep.tracking_code}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Mitra / Shohibul Qurban:{' '}
                  <span className="font-semibold text-slate-800">
                    {sheep.customer_name}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Share and WhatsApp CTAs */}
            <div className="md:w-80 w-full shrink-0">
              <TrackerActions
                trackingCode={sheep.tracking_code}
                customerName={sheep.customer_name}
              />
            </div>
          </div>
        </div>

        {/* 6 Key Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {/* Card 1: Pemilik */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Pemilik
            </span>
            <span className="text-sm font-bold text-slate-900 block truncate" title={sheep.customer_name}>
              {sheep.customer_name}
            </span>
            <span className="text-[11px] text-slate-500">Mitra Terdaftar</span>
          </div>

          {/* Card 2: Ras & Gender */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Ras / Gender
            </span>
            <span className="text-sm font-bold text-slate-900 block truncate">
              {sheep.breed}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <span>{sheep.gender === 'Jantan' ? '♂' : '♀'}</span>
              <span>{sheep.gender}</span>
            </span>
          </div>

          {/* Card 3: BB Awal */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              BB Awal Masuk
            </span>
            <span className="text-base font-extrabold text-slate-800 font-mono block">
              {formatWeight(sheep.initial_weight)}
            </span>
            <span className="text-[11px] text-slate-500">Saat Masuk Kandang</span>
          </div>

          {/* Card 4: BB Saat Ini */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">
              BB Saat Ini
            </span>
            <span className="text-base font-extrabold text-emerald-900 font-mono block">
              {formatWeight(currentWeight)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-700 font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>{weightGain >= 0 ? `+${weightGain.toFixed(1)}` : weightGain.toFixed(1)} kg</span>
            </span>
          </div>

          {/* Card 5: Target BB */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Target Bobot
            </span>
            <span className="text-base font-extrabold text-slate-800 font-mono block">
              {formatWeight(sheep.target_weight)}
            </span>
            <span className="text-[11px] text-amber-700 font-semibold">
              {progressPercent}% Menuju Target
            </span>
          </div>

          {/* Card 6: Countdown Iduladha */}
          <CountdownCard />
        </div>

        {/* Growth Progress Bar Banner */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-800" />
              <span className="font-bold text-slate-800">
                Pencapaian Penggemukan Target Iduladha
              </span>
            </div>
            <span className="font-bold text-emerald-800">
              {progressPercent}% ({formatWeight(currentWeight)} / {formatWeight(sheep.target_weight)})
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-800 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Weight Growth Chart Section */}
        <div className="rounded-3xl bg-white border border-stone-200/90 shadow-xs p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Grafik Pertumbuhan Bobot Domba
              </h2>
              <p className="text-xs text-slate-500">
                Data tercatat dari penimbangan berkala di Kandang Kang Iky.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 self-start sm:self-auto">
              {rawLogs.length + 1} Titik Pengukuran
            </span>
          </div>

          <WeightChart
            initialWeight={sheep.initial_weight}
            targetWeight={sheep.target_weight}
            entryDate={sheep.entry_date}
            logs={rawLogs}
          />
        </div>

        {/* Progress Timeline Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Linimasa Perkembangan & Rekam Medis
              </h2>
              <p className="text-xs text-slate-500">
                Riwayat catatan kondisi fisik, asupan pakan, dan foto berkala dari kandang.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-slate-700">
              {rawLogs.length} Catatan
            </span>
          </div>

          <ProgressFeed
            logs={rawLogs}
            initialWeight={sheep.initial_weight}
            entryDate={sheep.entry_date}
          />
        </div>

        {/* Bottom CTA Card */}
        <div className="rounded-3xl bg-emerald-900 text-white p-6 sm:p-8 space-y-4 shadow-xl shadow-emerald-950/20">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-xl font-bold">
              Ingin Mengetahui Info Lebih Lanjut Tentang Domba Anda?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Tim peternak Kang Iky siap memberikan informasi langsung dan dokumentasi video tambahan melalui WhatsApp resmi kami.
            </p>
          </div>

          <div className="pt-2 max-w-md">
            <TrackerActions
              trackingCode={sheep.tracking_code}
              customerName={sheep.customer_name}
            />
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2026 Kandang Kang Iky • AgriFintech & Livestock Intelligence.
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Parung, Bogor</span>
            <span>•</span>
            <Link href="/" className="hover:text-emerald-800">
              Lacak Ternak Lain
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TrackerFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white text-xl font-bold flex items-center justify-center mx-auto animate-bounce">
          🐑
        </div>
        <p className="text-sm font-semibold text-slate-700">
          Memuat Data Lacak Domba...
        </p>
        <p className="text-xs text-slate-400">Mengambil histori perkembangan terkini</p>
      </div>
    </div>
  )
}

export default function TrackSheepPage({ params }: PageProps) {
  return (
    <Suspense fallback={<TrackerFallback />}>
      <TrackerContent params={params} />
    </Suspense>
  )
}
