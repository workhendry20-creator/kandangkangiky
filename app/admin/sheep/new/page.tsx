import React, { Suspense } from 'react'
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
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white text-xl font-bold flex items-center justify-center mx-auto animate-bounce">
          🐑
        </div>
        <p className="text-sm font-semibold text-slate-700">Memuat Form Domba Baru...</p>
        <p className="text-xs text-slate-400">Menyiapkan kode unik tracking</p>
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
