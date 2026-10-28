export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from "react";
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { SheepTable } from '@/components/admin/SheepTable'
import type { Sheep, SheepSold } from '@/types/sheep'
import {
  TrendingUp,
  Activity,
  Users,
  Sparkles,
  Scale,
  CheckCircle2,
} from 'lucide-react'

async function DashboardContent() {
  const db = createAdminClient()

  // 1. Fetch sold sheep first (Tab 2: Domba Terjual / Selesai)
  let soldList: SheepSold[] = []
  try {
    const { data: soldData, error: soldError } = await db
      .from('sheep_sold')
      .select('*')
      .order('sold_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (soldError) {
      console.warn('[Dashboard] Note fetching sheep_sold:', soldError.message)
    } else if (soldData) {
      soldList = soldData as unknown as SheepSold[]
    }
  } catch (err) {
    console.warn('[Dashboard] Unexpected error fetching sheep_sold:', err)
  }

  // Kumpulkan list tracking_code dan original_sheep_id dari domba yang sudah terjual
  const soldTrackingCodes = soldList.map((s) => s.tracking_code).filter(Boolean)
  const soldOriginalSheepIds = new Set(soldList.map((s) => s.original_sheep_id).filter(Boolean))
  const soldCodesSet = new Set(soldTrackingCodes)

  // 2. Fetch data aktif Tab 1 ("Master Domba Titipan") dari tabel sheep
  // Filter kueri Tab 1 agar membuang domba yang ID/tracking_code nya ada di dalam list sheep_sold
  // dan secara KETAT hanya menampilkan domba titipan customer (bukan stok kandang / null / kosong)
  let sheepList: Sheep[] = []
  try {
    let sheepQuery = db
      .from('sheep')
      .select(`
        *,
        progress_logs (
          current_weight,
          record_date,
          created_at
        )
      `)
      .not('customer_name', 'is', null)
      .neq('customer_name', '')
      .neq('customer_name', 'Stok Kandang')
      .order('created_at', { ascending: false })
      .order('record_date', { referencedTable: 'progress_logs', ascending: false })
      .order('created_at', { referencedTable: 'progress_logs', ascending: false })

    if (soldTrackingCodes.length > 0) {
      sheepQuery = sheepQuery.not('tracking_code', 'in', `(${soldTrackingCodes.join(',')})`)
    }

    const { data, error } = await sheepQuery

    if (error) {
      console.error('[Dashboard] Error fetching sheep from Supabase:', error)
      let fallbackQuery = db
        .from('sheep')
        .select('*')
        .not('customer_name', 'is', null)
        .neq('customer_name', '')
        .neq('customer_name', 'Stok Kandang')
        .order('created_at', { ascending: false })

      if (soldTrackingCodes.length > 0) {
        fallbackQuery = fallbackQuery.not('tracking_code', 'in', `(${soldTrackingCodes.join(',')})`)
      }

      const fallback = await fallbackQuery

      if (fallback.data) {
        sheepList = (fallback.data as unknown as Sheep[])
          .filter(
            (item) =>
              !soldCodesSet.has(item.tracking_code) &&
              !soldOriginalSheepIds.has(item.id) &&
              item.status !== 'Terjual' &&
              item.status !== 'Selesai' &&
              Boolean(item.customer_name) &&
              item.customer_name.trim() !== '' &&
              item.customer_name.trim() !== 'Stok Kandang'
          )
          .map((item) => ({
            ...item,
            current_weight: item.current_weight ?? item.initial_weight,
          }))
      }
    } else if (data) {
      sheepList = (data as unknown as Sheep[])
        // Filter ganda memastikan domba terjual dan domba tanpa customer tidak muncul di Tab 1
        .filter(
          (item) =>
            !soldCodesSet.has(item.tracking_code) &&
            !soldOriginalSheepIds.has(item.id) &&
            item.status !== 'Terjual' &&
            item.status !== 'Selesai' &&
            Boolean(item.customer_name) &&
            item.customer_name.trim() !== '' &&
            item.customer_name.trim() !== 'Stok Kandang'
        )
        .map((item) => {
          const initialWeight = Number(item.initial_weight) || 0
          let calculatedWeight =
            item.current_weight !== undefined && item.current_weight !== null
              ? Number(item.current_weight)
              : initialWeight

          if (item.progress_logs && Array.isArray(item.progress_logs) && item.progress_logs.length > 0) {
            const sortedLogs = [...item.progress_logs].sort((a, b) => {
              const dateDiff = new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
              if (dateDiff !== 0) return dateDiff
              const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
              const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
              return bCreated - aCreated
            })

            const latestLogWeight = Number(sortedLogs[0].current_weight)
            if (!isNaN(latestLogWeight) && latestLogWeight > 0) {
              calculatedWeight = latestLogWeight
            }
          }

          return {
            ...item,
            current_weight: calculatedWeight,
          }
        })
    }
  } catch (err) {
    console.error('[Dashboard] Unexpected error fetching master data domba:', err)
  }

  // Calculate Dashboard Metrics
  const activeCount = sheepList.length
  const soldCount = soldList.length

  const allCustomerNames = [
    ...sheepList.map((s) => s.customer_name.trim().toLowerCase()),
    ...soldList.map((s) => s.customer_name.trim().toLowerCase()),
  ]
  const uniqueCustomers = new Set(allCustomerNames.filter(Boolean)).size

  const avgWeight =
    activeCount > 0
      ? (
          sheepList.reduce(
            (acc, s) => acc + (s.current_weight ?? s.initial_weight),
            0
          ) / activeCount
        ).toFixed(1)
      : '0.0'

  return (
    <div className="flex-1 flex flex-col bg-[#EBF2E8]">
      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Greeting Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#B1C5AA]/40 p-6 sm:p-8 shadow-xs">
          <div className="absolute -right-10 -top-10 w-52 h-52 bg-[#D9E5D6]/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9E5D6] text-[#5C6F57] text-xs font-semibold border border-[#B1C5AA]/40">
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
          </div>
        </div>

        {/* KPI Stat Cards (3 Required + 1 Avg Weight) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Ternak Aktif */}
          <div className="bg-white rounded-2xl p-5 border border-[#B1C5AA]/40 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Ternak
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#D9E5D6] text-[#5C6F57] flex items-center justify-center font-bold">
                🐑
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">{activeCount}</span>
                <span className="text-sm text-slate-500">ekor</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[#5C6F57] font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Domba Aktif Penitipan</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-[#5C6F57]">{activeCount} Aktif</span>
              <span>•</span>
              <span className="font-semibold text-amber-700">{soldCount} Selesai / Terjual</span>
            </div>
          </div>

          {/* Card 2: Total Customer */}
          <div className="bg-white rounded-2xl p-5 border border-[#B1C5AA]/40 shadow-xs flex flex-col justify-between">
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
              <span className="text-[#5C6F57] font-medium">100% Terverifikasi</span>
            </div>
          </div>

          {/* Card 3: Domba Terjual / Selesai */}
          <div className="bg-white rounded-2xl p-5 border border-[#B1C5AA]/40 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Domba Terjual
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-amber-800">{soldCount}</span>
                <span className="text-sm text-slate-500">ekor</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Telah Selesai Masa Penitipan</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
              <span>Masa Penitipan Selesai</span>
              <span className="text-[#5C6F57] font-medium">Tersimpan di sheep_sold</span>
            </div>
          </div>

          {/* Card 4: Rata-rata Bobot */}
          <div className="bg-white rounded-2xl p-5 border border-[#B1C5AA]/40 shadow-xs flex flex-col justify-between">
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
              <span className="text-[#5C6F57] font-medium">Terkalibrasi</span>
            </div>
          </div>
        </div>

        {/* Master Data Sheep Table with Search Filter */}
        <SheepTable initialSheep={sheepList} soldSheep={soldList} />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#B1C5AA]/40 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">© 2026 Kandang Kang Iky.</span>
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
    <div className="min-h-screen bg-[#EBF2E8] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xs ring-1 ring-[#B1C5AA]/50 bg-white flex items-center justify-center mx-auto">
          <Image
            src="/logo.jpg"
            alt="Kandang Kang Iky"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm font-semibold text-slate-800">Memuat Dashboard Admin...</p>
        <p className="text-xs text-slate-500">Mengambil data ternak dari Supabase</p>
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
