import { Suspense } from "react";
import Image from 'next/image'
import { connection } from 'next/server'
import { generateTrackingCode } from '@/lib/utils'
import { NewSheepForm } from '@/components/admin/NewSheepForm'

async function NewSheepContent() {
  await connection()
  const initialTrackingCode = generateTrackingCode()
  const initialEntryDate = new Date().toISOString().split('T')[0]

  return (
    <NewSheepForm
      initialTrackingCode={initialTrackingCode}
      initialEntryDate={initialEntryDate}
    />
  )
}

function NewSheepFallback() {
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
        <p className="text-sm font-semibold text-slate-800">Memuat Form Domba Baru...</p>
        <p className="text-xs text-slate-500">Menyiapkan kode unik tracking</p>
      </div>
    </div>
  )
}

export default function NewSheepPage() {
  return (
    <Suspense fallback={<NewSheepFallback />}>
      <NewSheepContent />
    </Suspense>
  )
}
