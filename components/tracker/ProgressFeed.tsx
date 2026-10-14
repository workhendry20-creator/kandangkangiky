'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDate, formatWeight } from '@/lib/utils'
import type { ProgressLog } from '@/types/sheep'
import {
  Calendar,
  Activity,
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Camera,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'

interface ProgressFeedProps {
  logs: ProgressLog[]
  initialWeight: number
  entryDate: string
}

const DEFAULT_PAGE_SIZE = 5

export function ProgressFeed({
  logs,
  initialWeight,
  entryDate,
}: ProgressFeedProps) {
  const [activeModalImage, setActiveModalImage] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Sort logs in reverse chronological order (newest first: record_date DESC, created_at DESC)
  const sortedLogs = [...logs].sort((a, b) => {
    const dateDiff =
      new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    if (dateDiff !== 0) return dateDiff
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
    return bCreated - aCreated
  })

  // Precompute weight and total gain up to each log
  const chronologicalLogs = [...logs].sort((a, b) => {
    const dateDiff =
      new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    if (dateDiff !== 0) return dateDiff
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
    return aCreated - bCreated
  })

  const logAccumulatedMap = new Map<string, { accumulatedWeight: number; totalGain: number }>()
  chronologicalLogs.forEach((l) => {
    const logWeight = Number(l.current_weight) || initialWeight
    const gain = Math.round((logWeight - initialWeight) * 100) / 100
    logAccumulatedMap.set(l.id, { accumulatedWeight: logWeight, totalGain: gain })
  })

  if (sortedLogs.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-[#B1C5AA]/40 p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF2E8] text-[#5C6F57] text-2xl flex items-center justify-center mx-auto">
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

  // Limit display to 5 logs by default unless expanded
  const displayedLogs = isExpanded ? sortedLogs : sortedLogs.slice(0, DEFAULT_PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Compact Datasheet Table Card */}
      <div className="bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-[#B1C5AA]/30 bg-[#EBF2E8]/60 text-[11px] font-bold uppercase tracking-wider text-[#5C6F57]">
                <th className="py-3 px-4 sm:px-5">Tanggal Update</th>
                <th className="py-3 px-4">Jenis Update</th>
                <th className="py-3 px-4">BB & Kenaikan</th>
                <th className="py-3 px-4">Status Kesehatan</th>
                <th className="py-3 px-4">Catatan & Dokumentasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {displayedLogs.map((log, index) => {
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
                  <tr
                    key={log.id}
                    className="hover:bg-[#EBF2E8]/20 transition-colors"
                  >
                    {/* Tanggal Update */}
                    <td className="py-3 px-4 sm:px-5 font-semibold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(log.record_date)}</span>
                        {isLatest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9E5D6] text-[#5C6F57]">
                            <Sparkles className="w-3 h-3" />
                            <span>Terbaru</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Jenis Update */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-slate-700 border border-stone-200/60">
                        {updateBadgeLabel}
                      </span>
                    </td>

                    {/* BB & Kenaikan */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold font-mono text-slate-900">
                          {formatWeight(accumulatedWeight)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                            totalGain > 0
                              ? 'text-[#5C6F57]'
                              : totalGain < 0
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {totalGain > 0 ? (
                            <TrendingUp className="w-3 h-3 shrink-0" />
                          ) : totalGain < 0 ? (
                            <TrendingDown className="w-3 h-3 shrink-0" />
                          ) : (
                            <Minus className="w-3 h-3 shrink-0" />
                          )}
                          <span>
                            {totalGain > 0
                              ? `+${totalGain.toFixed(1)}`
                              : totalGain < 0
                              ? totalGain.toFixed(1)
                              : '0'} kg
                          </span>
                        </span>
                      </div>
                    </td>

                    {/* Status Kesehatan */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          log.health_status === 'Sehat'
                            ? 'bg-[#EBF2E8] text-[#5C6F57] border border-[#B1C5AA]'
                            : log.health_status === 'Dalam Perawatan'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <Activity className="w-3 h-3 shrink-0" />
                        <span>{log.health_status}</span>
                      </span>
                    </td>

                    {/* Catatan & Dokumentasi */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {log.notes ? (
                          <div className="flex items-start gap-1.5 max-w-xs sm:max-w-sm">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-600 line-clamp-1 leading-relaxed">
                              {log.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}

                        {log.media_url && (
                          <button
                            type="button"
                            onClick={() => setActiveModalImage(log.media_url || null)}
                            aria-label="Lihat dokumentasi foto"
                            title="Klik untuk memperbesar foto dokumentasi"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#B1C5AA]/60 bg-white hover:bg-[#EBF2E8] text-[#5C6F57] text-xs font-medium transition-colors cursor-pointer shrink-0 shadow-2xs"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#5C6F57]" />
                            <span className="hidden sm:inline">Foto</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & collapse toggle */}
        <div className="p-3.5 sm:p-4 border-t border-stone-100 bg-[#EBF2E8]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            Menampilkan <span className="font-bold text-slate-800">{displayedLogs.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{sortedLogs.length}</span> catatan riwayat perkembangan
          </span>

          {sortedLogs.length > DEFAULT_PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#B1C5AA] bg-white hover:bg-[#EBF2E8] text-[#5C6F57] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Tampilkan 5 Catatan Saja</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Lihat Semua Riwayat ({sortedLogs.length} Catatan)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {activeModalImage && (
        <div
          onClick={() => setActiveModalImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[85vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setActiveModalImage(null)}
              aria-label="Tutup foto"
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
