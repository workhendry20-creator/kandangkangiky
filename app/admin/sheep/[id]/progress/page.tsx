import React, { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgressForm } from '@/components/admin/ProgressForm'
import type { Sheep } from '@/types/sheep'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function ProgressContent({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sheepData, error } = await supabase
    .from('sheep')
    .select(`
      *,
      progress_logs (
        current_weight,
        record_date
      )
    `)
    .eq('id', id)
    .single()

  if (error || !sheepData) {
    notFound()
  }

  const sheep = sheepData as Sheep
  let lastWeight = sheep.initial_weight

  if (sheep.progress_logs && sheep.progress_logs.length > 0) {
    const sorted = [...sheep.progress_logs].sort(
      (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    )
    lastWeight = sorted[0].current_weight
  }

  return <ProgressForm sheep={sheep} lastWeight={lastWeight} />
}

function ProgressFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white text-xl font-bold flex items-center justify-center mx-auto animate-bounce">
          🐑
        </div>
        <p className="text-sm font-semibold text-slate-700">Memuat Form Progress Domba...</p>
        <p className="text-xs text-slate-400">Mengambil histori bobot ternak</p>
      </div>
    </div>
  )
}

export default function ProgressPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ProgressFallback />}>
      <ProgressContent params={params} />
    </Suspense>
  )
}
