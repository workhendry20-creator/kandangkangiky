'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  X,
  ExternalLink,
  ClipboardList,
  UserPlus,
  Scale,
  Calendar,
  Activity,
  TrendingUp,
  Phone,
  Loader2,
} from 'lucide-react'
import { formatWeight, formatDate } from '@/lib/utils'
import { getSheepProgressLogs } from '@/lib/actions/progress'
import type { FarmSheep } from '@/types/farm-sheep'
import type { ProgressLog } from '@/types/sheep'

interface SheepDetailModalProps {
  sheep: FarmSheep | null
  isOpen: boolean
  onClose: () => void
  onOpenAssignCustomer?: (sheep: FarmSheep) => void
  onOpenEdit?: (sheep: FarmSheep) => void
}

export function SheepDetailModal({
  sheep,
  isOpen,
  onClose,
  onOpenAssignCustomer,
  onOpenEdit,
}: SheepDetailModalProps) {
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && sheep) {
      let isMounted = true
      setIsLoadingLogs(true)
      getSheepProgressLogs(sheep.id, sheep.tag_code)
        .then((res) => {
          if (isMounted) {
            setLogs(res.logs || [])
            setIsLoadingLogs(false)
          }
        })
        .catch(() => {
          if (isMounted) {
            setLogs([])
            setIsLoadingLogs(false)
          }
        })

      return () => {
        isMounted = false
      }
    } else {
      setLogs([])
      setPreviewMediaUrl(null)
    }
  }, [isOpen, sheep])

  if (!isOpen || !sheep) return null

  const initialWeight = Number(sheep.initial_weight) || 0
  const currentWeight = Number(sheep.current_weight ?? sheep.initial_weight) || initialWeight
  const weightGain = currentWeight - initialWeight

  // Status badge style helper
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Hamil':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Menyusui':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'Kosongan/Menyusui':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Kosongan':
        return 'bg-stone-100 text-stone-700 border-stone-200'
      case 'Pemacek':
        return 'bg-[#D9E5D6] text-[#5C6F57] border-[#B1C5AA]/50'
      case 'Siap Kawin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Afkir':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      default:
        return 'bg-stone-100 text-slate-700 border-stone-200'
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheep-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 bg-[#EBF2E8]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9E5D6] text-[#5C6F57] flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              {sheep.gender === 'Betina' ? '♀' : '♂'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-white border border-stone-200 text-slate-800 shadow-2xs">
                  {sheep.tag_code}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    sheep.gender === 'Betina'
                      ? 'bg-pink-50 text-pink-700 border-pink-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {sheep.gender} • {sheep.sheep_type}
                </span>
              </div>
              <h2 id="sheep-detail-title" className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {sheep.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Section 1: Relocated Columns (Kepemilikan, Tgl Masuk, Status Biologis) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Kepemilikan Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Kepemilikan
              </span>
              {sheep.customer_name ? (
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9E5D6] text-[#5C6F57] border border-[#B1C5AA]/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5C6F57]" />
                    Titipan Customer
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={sheep.customer_name}>
                    {sheep.customer_name}
                  </p>
                  {sheep.customer_phone && (
                    <a
                      href={`https://wa.me/${sheep.customer_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#5C6F57] hover:underline mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{sheep.customer_phone}</span>
                    </a>
                  )}
                </div>
              ) : (
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-200/70 text-slate-700 border border-stone-300/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Stok Kandang
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Milik Peternakan</p>
                  {onOpenAssignCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenAssignCustomer(sheep)
                      }}
                      className="mt-2 text-[11px] font-bold text-[#5C6F57] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Assign ke Customer</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tanggal Masuk Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Tanggal Masuk
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm">
                  <Calendar className="w-3.5 h-3.5 text-[#5C6F57]" />
                  <span>{formatDate(sheep.entry_date)}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Asal: <span className="font-medium text-slate-600">{sheep.origin || 'Beli'}</span>
                </p>
              </div>
            </div>

            {/* Status Biologis Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Status Biologis
              </span>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(
                    sheep.status
                  )}`}
                >
                  {sheep.status}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ras: <span className="font-medium text-slate-600">{sheep.breed}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Bobot & Pertumbuhan */}
          <div className="p-4 rounded-2xl bg-[#EBF2E8]/40 border border-[#B1C5AA]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#B1C5AA]/50 flex items-center justify-center text-[#5C6F57] shadow-2xs">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Perkembangan Bobot
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold font-mono text-slate-900">
                    {formatWeight(currentWeight)}
                  </span>
                  <span className="text-xs text-slate-500">
                    (Awal: {formatWeight(initialWeight)})
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Pertambahan
              </span>
              {weightGain > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[#5C6F57] mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{weightGain.toFixed(1)} kg</span>
                </span>
              ) : weightGain < 0 ? (
                <span className="text-sm font-bold text-rose-600 mt-0.5">
                  {weightGain.toFixed(1)} kg
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-400 mt-0.5">Stabil</span>
              )}
            </div>
          </div>

          {/* Section 3: Riwayat Perkembangan & Medis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#5C6F57]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Riwayat Log Progress & Rekam Medis
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {logs.length} catatan
              </span>
            </div>

            {isLoadingLogs ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 bg-stone-50 rounded-2xl border border-stone-100">
                <Loader2 className="w-5 h-5 animate-spin text-[#5C6F57]" />
                <span className="text-xs">Memuat riwayat progress...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200 space-y-2">
                <p className="text-xs text-slate-500">
                  Belum ada catatan log progress untuk domba ini.
                </p>
                <Link
                  href={`/admin/sheep/${sheep.id}/progress`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#5C6F57] hover:underline"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>+ Input Log Progress Sekarang</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {logs.map((log) => {
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-stone-200/80 bg-white hover:bg-stone-50/60 transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">
                            {formatDate(log.record_date)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-slate-600 text-[10px] font-medium border border-stone-200">
                            {log.update_type}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              log.health_status === 'Sehat'
                                ? 'bg-[#D9E5D6] text-[#5C6F57]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.health_status}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {log.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {log.current_weight !== null && log.current_weight !== undefined && (
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {formatWeight(log.current_weight)}
                          </span>
                        )}

                        {log.media_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewMediaUrl(log.media_url!)}
                            className="relative w-8 h-8 rounded-lg overflow-hidden border border-stone-200 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                            title="Lihat Foto"
                          >
                            <Image
                              src={log.media_url}
                              alt="Dokumentasi progress domba"
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Catatan Tambahan Peternakan */}
          {sheep.notes && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
              <span className="font-bold block mb-0.5">Catatan Khusus:</span>
              <span>{sheep.notes}</span>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/track/${sheep.tag_code}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
              title="Buka portal lacak publik"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Portal Lacak Publik</span>
            </Link>

            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenEdit(sheep)
                }}
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                Edit Data
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/sheep/${sheep.id}/progress`}
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5C6F57] hover:bg-[#485844] text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>+ Log Progress</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Media Zoom Overlay */}
      {previewMediaUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div className="relative max-w-lg w-full bg-black rounded-2xl overflow-hidden p-2">
            <button
              type="button"
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full h-80 sm:h-96">
              <Image
                src={previewMediaUrl}
                alt="Foto Dokumentasi Domba"
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
