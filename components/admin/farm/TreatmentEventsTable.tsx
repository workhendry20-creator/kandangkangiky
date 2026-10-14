'use client'

import { useState, useTransition } from 'react'
import { deleteFarmEvent } from '@/lib/actions/farm-sheep'
import type { FarmEvent } from '@/types/farm-sheep'
import {
  HeartPulse,
  Plus,
  Calendar,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'

interface TreatmentEventsTableProps {
  events: FarmEvent[]
  onOpenNewTreatmentModal: () => void
  onRefresh: () => void
}

export function TreatmentEventsTable({
  events,
  onOpenNewTreatmentModal,
  onRefresh,
}: TreatmentEventsTableProps) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [, startTransition] = useTransition()

  // Filter only 'Tindakan' events
  const treatmentEvents = events.filter((e) => e.event_type === 'Tindakan')

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus catatan rekam medis ini?')) {
      setIsDeletingId(id)
      setToast(null)
      startTransition(async () => {
        const res = await deleteFarmEvent(id)
        setIsDeletingId(null)
        if (res.success) {
          setToast({
            type: 'success',
            message: 'Catatan rekam medis berhasil dihapus dan disinkronkan ke Google Sheets!',
          })
          onRefresh()
          setTimeout(() => setToast(null), 5000)
        } else {
          setToast({
            type: 'error',
            message: res.error || 'Gagal menghapus rekam medis.',
          })
          setTimeout(() => setToast(null), 5000)
        }
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Rekam Medis & Tindakan Perawatan Domba Kandang
          </h3>
          <p className="text-xs text-slate-500">
            Total {treatmentEvents.length} tindakan tercatat (Vaksin, Obat Cacing, Vitamin & Sanitasi)
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewTreatmentModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Rekam Tindakan Medis</span>
        </button>
      </div>

      {/* Toast Alert Feedback */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            toast.type === 'success'
              ? 'bg-[#EBF2E8] text-[#5C6F57] border-[#B1C5AA]'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#5C6F57] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-[#B1C5AA]/30 bg-[#EBF2E8]/60 text-[11px] font-bold uppercase tracking-wider text-[#5C6F57]">
                <th className="py-3.5 px-4 sm:px-6">Tgl Tindakan</th>
                <th className="py-3.5 px-4">Domba Sasaran</th>
                <th className="py-3.5 px-4">Nama / Jenis Tindakan</th>
                <th className="py-3.5 px-4">Keterangan / Dosis</th>
                <th className="py-3.5 px-4 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {treatmentEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto text-xl">
                        <HeartPulse className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700">
                        Belum Ada Rekam Medis
                      </p>
                      <p className="text-xs text-slate-400">
                        Catat riwayat vaksinasi, obat cacing, potong kuku, atau pemberian vitamin domba kandang.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewTreatmentModal}
                        className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-xs"
                      >
                        Rekam Tindakan Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                treatmentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Tgl Tindakan */}
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.event_date}</span>
                      </div>
                    </td>

                    {/* Domba Sasaran */}
                    <td className="py-3.5 px-4">
                      {event.sheep ? (
                        <div>
                          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-stone-100 text-slate-800 border border-stone-200">
                            {event.sheep.tag_code}
                          </span>
                          <span className="ml-2 font-bold text-slate-900">
                            {event.sheep.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-1.5">
                            ({event.sheep.breed} • {event.sheep.gender})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Domba tidak ditemukan</span>
                      )}
                    </td>

                    {/* Nama Tindakan */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                        <span>{event.action_name}</span>
                      </span>
                    </td>

                    {/* Keterangan */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                      {event.notes || '-'}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <button
                        type="button"
                        disabled={isDeletingId !== null}
                        onClick={() => handleDelete(event.id)}
                        aria-label="Hapus rekam medis"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Hapus rekam medis"
                      >
                        {isDeletingId === event.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50/40 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {treatmentEvents.length} rekam medis & tindakan</span>
          <span>Sinkronisasi otomatis ke Sheet 3 (Kelahiran_Tindakan)</span>
        </div>
      </div>
    </div>
  )
}
