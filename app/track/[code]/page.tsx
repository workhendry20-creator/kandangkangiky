export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { WeightChart } from '@/components/tracker/WeightChart'
import { ProgressFeed } from '@/components/tracker/ProgressFeed'
import { TrackerActions } from '@/components/tracker/TrackerActions'
import { CountdownCard } from '@/components/tracker/CountdownCard'
import { formatWeight, calculateRealtimeAge, formatDate } from '@/lib/utils'
import type { Sheep, SheepSold, ProgressLog } from '@/types/sheep'
import {
  ArrowLeft,
  Scale,
  Sparkles,
  TrendingUp,
  Search,
  Calendar,
  Clock,
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

  let { data, error } = await supabase
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
    .maybeSingle()

  let sheep: Sheep | null = data as Sheep | null
  let rawLogs: ProgressLog[] = ((data?.progress_logs || []) as ProgressLog[])
  let isSold = false
  let soldDate: string | null = null

  // Fallback to sheep_sold table if not found in active sheep
  if (!sheep) {
    const { data: soldData } = await supabase
      .from('sheep_sold')
      .select('*')
      .eq('tracking_code', trackingCode)
      .maybeSingle()

    if (soldData) {
      isSold = true
      soldDate = soldData.sold_date

      // Fetch historical progress logs
      const { data: fetchedLogs } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('sheep_id', soldData.original_sheep_id)
        .order('record_date', { ascending: false })
        .order('created_at', { ascending: false })

      sheep = {
        id: soldData.original_sheep_id,
        tracking_code: soldData.tracking_code,
        customer_name: soldData.customer_name,
        customer_phone: soldData.customer_phone,
        breed: soldData.breed,
        gender: soldData.gender,
        initial_weight: Number(soldData.initial_weight),
        target_weight: Number(soldData.final_weight),
        current_weight: Number(soldData.final_weight),
        entry_date: soldData.entry_date,
        status: 'Terjual',
        created_at: soldData.created_at,
      }
      rawLogs = (fetchedLogs || []) as ProgressLog[]
    }
  }

  if (!sheep) {
    return (
      <div className="min-h-screen bg-white flex flex-col text-slate-800">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#5C6F57] transition-colors p-2 -ml-2 rounded-xl hover:bg-stone-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-xs ring-1 ring-[#5C6F57]/20 bg-white">
                <Image
                  src="/logo.jpg"
                  alt="Kandang Kang Iky Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              </div>
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
              Kode tracking <span className="font-mono font-bold text-[#5C6F57] bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">&ldquo;{trackingCode}&rdquo;</span> tidak terdaftar di sistem Kandang Kang Iky. Pastikan Anda memasukkan kode yang sesuai dari kwitansi atau pesan tim kami.
            </p>
          </div>

          <div className="pt-2 w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#5C6F57] hover:bg-[#4d5e49] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Kembali ke Halaman Pencarian</span>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  rawLogs = [...rawLogs].sort((a, b) => {
    const dateDiff =
      new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    if (dateDiff !== 0) return dateDiff
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
    return bCreated - aCreated
  })

  // BB Saat Ini membaca log terbaru yang sudah dijumlahkan
  const initialWeight = Number(sheep.initial_weight) || 0
  const currentWeight =
    rawLogs.length > 0 &&
      rawLogs[0].current_weight !== null &&
      rawLogs[0].current_weight !== undefined
      ? Number(rawLogs[0].current_weight)
      : sheep.current_weight !== undefined && sheep.current_weight !== null
        ? Number(sheep.current_weight)
        : initialWeight

  // Total Naik / Kenaikan BB dihitung dari BB Terbaru - BB Awal Masuk
  const weightGain = Math.round((currentWeight - initialWeight) * 100) / 100

  // Calculate Progress towards Target Weight
  const totalTargetGain = sheep.target_weight - sheep.initial_weight
  const progressPercent =
    totalTargetGain > 0
      ? Math.min(100, Math.max(0, Math.round((weightGain / totalTargetGain) * 100)))
      : 100

  // Calculate realtime age based on arrival_date / entry_date
  const arrivalDateSource =
    sheep.arrival_date ||
    (data as Record<string, unknown> | null)?.arrival_date ||
    sheep.entry_date ||
    sheep.created_at
  const realtimeAge = calculateRealtimeAge(arrivalDateSource as string)

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#5C6F57] transition-colors p-2 -ml-2 rounded-xl hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-xs ring-1 ring-[#5C6F57]/20 bg-white">
              <Image
                src="/logo.jpg"
                alt="Kandang Kang Iky Logo"
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Kandang Kang Iky
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Sheep Hero Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-stone-200 shadow-xs p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBF2E8] text-[#5C6F57] border border-[#B1C5AA]">
                  {sheep.tracking_code}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isSold || sheep.status === 'Terjual' || sheep.status === 'Selesai'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-[#D9E5D6] text-[#5C6F57]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Status: {isSold || sheep.status === 'Terjual' ? 'Terjual / Selesai' : sheep.status}
                  </span>
                </span>
                {soldDate && (
                  <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-medium">
                    Tgl Selesai: {formatDate(soldDate)}
                  </span>
                )}
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
          </div>
        </div>

        {/* Realtime Age Information Card Section */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#B1C5AA]/40 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EBF2E8] text-[#5C6F57] flex items-center justify-center font-bold shadow-2xs">
                <Calendar className="w-5 h-5 text-[#5C6F57]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Informasi Umur Realtime Domba
                </h2>
                <p className="text-xs text-slate-500">
                  Perhitungan otomatis berdasarkan tanggal kedatangan / registrasi di peternakan.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2E8] text-[#5C6F57] text-xs font-semibold border border-[#B1C5AA] self-start sm:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#89A482] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5C6F57]" />
              </span>
              <span>Terhitung Realtime Hari Ini</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sub-Card 1: Tanggal Lahir / Kedatangan */}
            <div className="p-4 rounded-2xl bg-[#EBF2E8]/40 border border-[#B1C5AA]/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  Tanggal Lahir / Kedatangan
                </span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 block">
                {realtimeAge.formattedDate}
              </span>
              <p className="text-[11px] text-slate-500">
                Format: DD MMMM YYYY
              </p>
            </div>

            {/* Sub-Card 2: Total Umur dalam Hari */}
            <div className="p-4 rounded-2xl bg-[#EBF2E8]/40 border border-[#B1C5AA]/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  Total Umur (Hari)
                </span>
                <Clock className="w-4 h-4 text-[#5C6F57]" />
              </div>
              <span className="text-base sm:text-lg font-extrabold text-[#5C6F57] font-mono block">
                {realtimeAge.ageInDaysText}
              </span>
              <p className="text-[11px] text-slate-500">
                Akumulasi total hari pemeliharaan
              </p>
            </div>

            {/* Sub-Card 3: Total Umur dalam Bulan & Hari */}
            <div className="p-4 rounded-2xl bg-[#EBF2E8] border border-[#B1C5AA] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-[#5C6F57] tracking-wider">
                  Total Umur (Bulan & Hari)
                </span>
                <Sparkles className="w-4 h-4 text-[#5C6F57]" />
              </div>
              <span className="text-base sm:text-lg font-extrabold text-[#5C6F57] block">
                {realtimeAge.ageInMonthsText}
              </span>
              <p className="text-[11px] text-[#5C6F57]/80 font-medium">
                Kalkulasi presisi bulan kalender
              </p>
            </div>
          </div>
        </div>

        {/* 5 Key Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1: Ras & Gender */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Ras / Gender
            </span>
            <span className="text-sm font-bold text-slate-900 block truncate">
              {sheep.breed}
            </span>
            <span className="text-[11px] text-[#5C6F57] font-semibold flex items-center gap-1">
              <span>{sheep.gender === 'Jantan' ? '♂' : '♀'}</span>
              <span>{sheep.gender}</span>
            </span>
          </div>

          {/* Card 3: BB Awal */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              BB Awal Masuk
            </span>
            <span className="text-base font-extrabold text-slate-800 font-mono block">
              {formatWeight(sheep.initial_weight)}
            </span>
            <span className="text-[11px] text-slate-500">Saat Masuk Kandang</span>
          </div>

          {/* Card 4: BB Saat Ini */}
          <div className="p-4 rounded-2xl bg-[#EBF2E8] border border-[#B1C5AA] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#5C6F57] block tracking-wider">
              BB Saat Ini
            </span>
            <span className="text-base font-extrabold text-[#5C6F57] font-mono block">
              {formatWeight(currentWeight)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-[#5C6F57] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>{weightGain >= 0 ? `+${weightGain.toFixed(1)}` : weightGain.toFixed(1)} kg</span>
            </span>
          </div>

          {/* Card 5: Target BB */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
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
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <CountdownCard />
          </div>
        </div>

        {/* Growth Progress Bar Banner */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#5C6F57]" />
              <span className="font-bold text-slate-800">
                Pencapaian Penggemukan Target Iduladha
              </span>
            </div>
            <span className="font-bold text-[#5C6F57]">
              {progressPercent}% ({formatWeight(currentWeight)} / {formatWeight(sheep.target_weight)})
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#5C6F57] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Weight Growth Chart Section */}
        <div className="rounded-3xl bg-white border border-stone-200 shadow-xs p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Grafik Pertumbuhan Bobot Domba
              </h2>
              <p className="text-xs text-slate-500">
                Data tercatat dari penimbangan berkala di Kandang Kang Iky.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EBF2E8] text-[#5C6F57] border border-[#B1C5AA] self-start sm:self-auto">
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
        <div className="rounded-3xl bg-[#5C6F57] text-white p-6 sm:p-8 space-y-4 shadow-sm border border-[#4d5e49]">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-xl font-bold">
              Ingin Mengetahui Info Lebih Lanjut Tentang Domba Anda?
            </h3>
            <p className="text-xs sm:text-sm text-[#D9E5D6] leading-relaxed">
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
          </div>
        </div>
      </footer>
    </div>
  )
}

function TrackerFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xs ring-1 ring-[#5C6F57]/20 bg-white flex items-center justify-center mx-auto animate-bounce">
          <Image
            src="/logo.jpg"
            alt="Kandang Kang Iky"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
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
