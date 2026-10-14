export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react'
import Image from 'next/image'
import { getFarmData } from '@/lib/actions/farm-sheep'
import { FarmSheepManagement } from '@/components/admin/farm/FarmSheepManagement'

async function FarmSheepContent() {
  const { farmSheep, farmEvents } = await getFarmData()

  return (
    <div className="flex-1 flex flex-col bg-[#EBF2E8]">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <FarmSheepManagement
          initialSheep={farmSheep}
          initialEvents={farmEvents}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#B1C5AA]/40 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">© 2026 Kandang Kang Iky.</span>
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
    <div className="min-h-screen bg-[#EBF2E8] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm ring-1 ring-[#B1C5AA]/50 bg-white flex items-center justify-center mx-auto">
          <Image
            src="/logo.jpg"
            alt="Kandang Kang Iky"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm font-semibold text-slate-800">Memuat Modul Inventaris Kandang...</p>
        <p className="text-xs text-slate-500">Mengambil data indukan, pejantan & rekam medis</p>
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
