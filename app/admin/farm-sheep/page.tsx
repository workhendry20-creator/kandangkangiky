export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { Suspense } from 'react'
import { getFarmData } from '@/lib/actions/farm-sheep'
import { FarmSheepManagement } from '@/components/admin/farm/FarmSheepManagement'

async function FarmSheepContent() {
  const { farmSheep, farmEvents } = await getFarmData()

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <FarmSheepManagement
          initialSheep={farmSheep}
          initialEvents={farmEvents}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© 2026 Kandang Kang Iky.</span>
            <span>•</span>
            <span>Inventaris Kandang & Breeding Management.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Status Sistem: Operasional Normal</span>
            <span>•</span>
            <span>Kandang Utama: Parung, Bogor</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FarmSheepFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white text-xl font-bold flex items-center justify-center mx-auto animate-bounce">
          🐑
        </div>
        <p className="text-sm font-semibold text-slate-700">Memuat Modul Inventaris Kandang...</p>
        <p className="text-xs text-slate-400">Mengambil data indukan, pejantan & rekam medis</p>
      </div>
    </div>
  )
}

export default function FarmSheepPage() {
  return (
    <Suspense fallback={<FarmSheepFallback />}>
      <FarmSheepContent />
    </Suspense>
  )
}
