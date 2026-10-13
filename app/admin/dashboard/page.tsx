export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { Suspense } from 'react'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { SheepTable } from '@/components/admin/SheepTable'
import type { Sheep } from '@/types/sheep'
import {
  TrendingUp,
  Activity,
  Users,
  Sparkles,
  Scale,
  CheckCircle2,
} from 'lucide-react'

async function DashboardContent() {
  // Fetch sheep and related progress logs using admin client to prevent cookie expiry issues
  let sheepList: Sheep[] = []
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('sheep')
      .select(`
        *,
        progress_logs (
          current_weight,
          record_date,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .order('record_date', { referencedTable: 'progress_logs', ascending: false })
      .order('created_at', { referencedTable: 'progress_logs', ascending: false })

    if (error) {
      console.error('[Dashboard] Error fetching sheep and progress_logs from Supabase:', error)

      // Fallback query if relation query encounters an issue
      const fallback = await db
        .from('sheep')
        .select('*')
        .order('created_at', { ascending: false })

      if (fallback.error) {
        console.error('[Dashboard] Error fetching fallback sheep data:', fallback.error)
      } else if (fallback.data) {
        sheepList = (fallback.data as unknown as Sheep[]).map((item) => ({
          ...item,
          current_weight: item.current_weight ?? item.initial_weight,
        }))
      }
    } else if (data) {
      sheepList = (data as unknown as Sheep[]).map((item) => {
        const initialWeight = Number(item.initial_weight) || 0
        let calculatedWeight =
          item.current_weight !== undefined && item.current_weight !== null
            ? Number(item.current_weight)
            : initialWeight

        if (item.progress_logs && Array.isArray(item.progress_logs) && item.progress_logs.length > 0) {
          // Sort progress_logs: record_date DESC, created_at DESC
          const sortedLogs = [...item.progress_logs].sort((a, b) => {
            const dateDiff = new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
            if (dateDiff !== 0) return dateDiff
            const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
            const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
            return bCreated - aCreated
          })

          // Akumulasi: initial_weight + TOTAL(current_weight dari seluruh progress_logs domba tersebut)
          const totalLogsGain = sortedLogs.reduce(
            (acc, log) => acc + (Number(log.current_weight) || 0),
            0
          )
          calculatedWeight = Math.round((initialWeight + totalLogsGain) * 100) / 100
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
    <div className="flex-1 flex flex-col">
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
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md shadow-emerald-800/10 ring-2 ring-emerald-700/20 bg-white flex items-center justify-center mx-auto animate-bounce">
          <Image
            src="/logo.jpg"
            alt="Kandang Kang Iky"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
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
