import { Suspense } from "react";
import Image from 'next/image'
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
  const initialWeight = Number(sheep.initial_weight) || 0
  let currentAccumulatedWeight =
    sheep.current_weight !== undefined && sheep.current_weight !== null
      ? Number(sheep.current_weight)
      : initialWeight

  if (sheep.progress_logs && sheep.progress_logs.length > 0) {
    const sortedLogs = [...sheep.progress_logs].sort((a, b) => {
      const dateDiff = new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
      if (dateDiff !== 0) return dateDiff
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
      return bCreated - aCreated
    })
    const latestLogWeight = Number(sortedLogs[0].current_weight)
    if (!isNaN(latestLogWeight) && latestLogWeight > 0) {
      currentAccumulatedWeight = latestLogWeight
    }
  }

  return (
    <ProgressForm
      sheep={{ ...sheep, current_weight: currentAccumulatedWeight }}
      lastWeight={currentAccumulatedWeight}
    />
  )
}

function ProgressFallback() {
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
        <p className="text-sm font-semibold text-slate-800">Memuat Form Progress Domba...</p>
        <p className="text-xs text-slate-500">Mengambil histori bobot ternak</p>
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
