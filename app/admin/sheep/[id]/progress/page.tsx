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

  let sheepRecord: Sheep | null = null
  let logs: Array<{ current_weight: number | string; record_date: string; created_at?: string }> = []

  const { data: sheepData } = await supabase
    .from('sheep')
    .select(`
      *,
      progress_logs (
        current_weight,
        record_date,
        created_at
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (sheepData) {
    sheepRecord = sheepData as Sheep
    logs = (sheepData.progress_logs || []) as typeof logs
  } else {
    // Universal Progress fallback: check farm_sheep table
    const { data: farmData } = await supabase
      .from('farm_sheep')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!farmData) {
      notFound()
    }

    const tagCode = String(farmData.tag_id || farmData.tag_code || farmData.id)

    // Check if progress logs exist for this sheep_id
    const { data: farmLogs } = await supabase
      .from('progress_logs')
      .select('current_weight, record_date, created_at')
      .eq('sheep_id', farmData.id)

    logs = (farmLogs || []) as typeof logs

    // Check if there is an existing customer in sheep table for this tagCode or id
    const { data: matchSheep } = await supabase
      .from('sheep')
      .select('customer_name, customer_phone, target_weight')
      .or(`id.eq.${farmData.id},tracking_code.eq.${tagCode}`)
      .maybeSingle()

    const initialWeight = Number(farmData.initial_weight) || 0
    const currentWeight = Number(farmData.current_weight || farmData.initial_weight) || initialWeight

    sheepRecord = {
      id: farmData.id,
      tracking_code: tagCode,
      customer_name: matchSheep?.customer_name || farmData.customer_name || '',
      customer_phone: matchSheep?.customer_phone || farmData.customer_phone || undefined,
      breed: farmData.breed || 'Garut',
      gender: farmData.gender || 'Jantan',
      initial_weight: initialWeight,
      current_weight: currentWeight,
      target_weight: Number(matchSheep?.target_weight) || initialWeight + 15,
      entry_date: farmData.arrival_date || farmData.entry_date || new Date().toISOString().split('T')[0],
      status: 'Penitipan',
      created_at: farmData.created_at || new Date().toISOString(),
    }
  }

  const initialWeight = Number(sheepRecord.initial_weight) || 0
  let currentAccumulatedWeight =
    sheepRecord.current_weight !== undefined && sheepRecord.current_weight !== null
      ? Number(sheepRecord.current_weight)
      : initialWeight

  if (logs && logs.length > 0) {
    const sortedLogs = [...logs].sort((a, b) => {
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
      sheep={{ ...sheepRecord, current_weight: currentAccumulatedWeight }}
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
