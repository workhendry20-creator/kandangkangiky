'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { formatDate, formatWeight } from '@/lib/utils'
import type { ProgressLog } from '@/types/sheep'
import {
  Calendar,
  Scale,
  Activity,
  FileText,
  Clock,
  Sparkles,
  Maximize2,
  X,
  TrendingUp,
} from 'lucide-react'

interface ProgressFeedProps {
  logs: ProgressLog[]
  initialWeight: number
  entryDate: string
}

export function ProgressFeed({
  logs,
  initialWeight,
  entryDate,
}: ProgressFeedProps) {
  const [activeModalImage, setActiveModalImage] = useState<string | null>(null)

  // Sort logs in reverse chronological order (newest first: record_date DESC, created_at DESC)
  const sortedLogs = [...logs].sort((a, b) => {
    const dateDiff =
      new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    if (dateDiff !== 0) return dateDiff
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
    return bCreated - aCreated
  })

  // Precompute running accumulated weight and total gain up to each log chronologically
  const chronologicalLogs = [...logs].sort((a, b) => {
    const dateDiff =
      new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    if (dateDiff !== 0) return dateDiff
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
    return aCreated - bCreated
  })

  const logAccumulatedMap = new Map<string, { accumulatedWeight: number; totalGain: number }>()
  let running = initialWeight
  chronologicalLogs.forEach((l) => {
    running = Math.round((running + Number(l.current_weight)) * 100) / 100
    const gain = Math.round((running - initialWeight) * 100) / 100
    logAccumulatedMap.set(l.id, { accumulatedWeight: running, totalGain: gain })
  })

  if (sortedLogs.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-stone-200/90 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 text-2xl flex items-center justify-center mx-auto">
          🐑
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">
            Belum Ada Log Perkembangan Berkala
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Domba baru saja terdaftar masuk kandang pada {formatDate(entryDate)} dengan bobot awal {formatWeight(initialWeight)}. Log timbang berkala dan foto akan diupdate oleh tim peternak segera.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-200">
        {sortedLogs.map((log, index) => {
          const accumInfo = logAccumulatedMap.get(log.id) || {
            accumulatedWeight: initialWeight + Number(log.current_weight),
            totalGain: Number(log.current_weight),
          }
          const accumulatedWeight = accumInfo.accumulatedWeight
          const totalGain = accumInfo.totalGain
          const isLatest = index === 0

          const updateBadgeLabel =
            log.update_type === 'Harian'
              ? 'Update Harian'
              : log.update_type === 'Mingguan'
              ? 'Timbangan Mingguan'
              : log.update_type === 'Bulanan'
              ? 'Laporan Bulanan'
              : `Update ${log.update_type}`

          return (
            <div key={log.id} className="relative pb-8 last:pb-0 group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-4 border-[#FDFBF7] ${
                  isLatest
                    ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/30'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isLatest ? (
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                ) : (
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </div>

              {/* Feed Card */}
              <div className="rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow p-5 space-y-4">
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(log.record_date)}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-slate-700 border border-stone-200/60">
                      {updateBadgeLabel}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                        Terbaru
                      </span>
                    )}
                  </div>

                  {/* Health Status Badge */}
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        log.health_status === 'Sehat'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : log.health_status === 'Dalam Perawatan'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {log.health_status}
                    </span>
                  </div>
                </div>

                {/* Weight Record Indicator */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-800 flex items-center justify-center">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Akumulasi Bobot
                      </span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {formatWeight(accumulatedWeight)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Total Kenaikan
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700">
                      <TrendingUp className="w-3 h-3" />
                      <span>
                        {totalGain >= 0 ? `+${totalGain.toFixed(1)}` : totalGain.toFixed(1)} kg
                      </span>
                    </span>
                  </div>
                </div>

                {/* Optional Notes */}
                {log.notes && (
                  <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-stone-100 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{log.notes}</p>
                  </div>
                )}

                {/* Photo / Media Preview */}
                {log.media_url && (
                  <div className="space-y-1.5 pt-1">
                    <div
                      onClick={() => setActiveModalImage(log.media_url || null)}
                      className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer group/img"
                    >
                      <Image
                        src={log.media_url}
                        alt={`Foto progress ${formatDate(log.record_date)}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 768px, 900px"
                        priority={isLatest}
                        className="object-cover group-hover/img:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[2px]">
                        <Maximize2 className="w-4 h-4" />
                        <span>Klik untuk perbesar</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {activeModalImage && (
        <div
          onClick={() => setActiveModalImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[85vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setActiveModalImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full h-[65vh] sm:h-[75vh]">
              <Image
                src={activeModalImage}
                alt="Foto Dokumentasi Ternak"
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
