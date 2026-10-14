'use client'

import { useState, useTransition } from 'react'
import { deleteFarmEvent } from '@/lib/actions/farm-sheep'
import type { FarmEvent } from '@/types/farm-sheep'
import {
  Baby,
  Plus,
  Calendar,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'

interface BirthEventsTableProps {
  events: FarmEvent[]
  onOpenNewBirthModal: () => void
  onRefresh: () => void
}

export function BirthEventsTable({
  events,
  onOpenNewBirthModal,
  onRefresh,
}: BirthEventsTableProps) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [, startTransition] = useTransition()

  // Filter only 'Kelahiran' events
  const birthEvents = events.filter((e) => e.event_type === 'Kelahiran')
  const totalLambs = birthEvents.reduce((acc, e) => acc + (e.lamb_count || 1), 0)

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus catatan kelahiran ini?')) {
      setIsDeletingId(id)
      setToast(null)
      startTransition(async () => {
        const res = await deleteFarmEvent(id)
        setIsDeletingId(null)
        if (res.success) {
          setToast({
            type: 'success',
            message: 'Catatan kelahiran berhasil dihapus dan disinkronkan ke Google Sheets!',
          })
          onRefresh()
          setTimeout(() => setToast(null), 5000)
        } else {
          setToast({
            type: 'error',
            message: res.error || 'Gagal menghapus catatan kelahiran.',
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
            Histori & Rekam Kelahiran Domba Kandang
          </h3>
          <p className="text-xs text-slate-500">
            Total {birthEvents.length} kelahiran tercatat ({totalLambs} ekor anakan)
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewBirthModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Kelahiran Baru</span>
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
                <th className="py-3.5 px-4 sm:px-6">Tgl Lahir</th>
                <th className="py-3.5 px-4">Induk Betina</th>
                <th className="py-3.5 px-4">Jumlah Anak</th>
                <th className="py-3.5 px-4">Keterangan / Kondisi Anak</th>
                <th className="py-3.5 px-4 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {birthEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-700 flex items-center justify-center mx-auto text-xl">
                        <Baby className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700">
                        Belum Ada Catatan Kelahiran
                      </p>
                      <p className="text-xs text-slate-400">
                        Catat proses kelahiran cempe baru untuk memperbarui status Indukan ke Kosongan/Menyusui secara otomatis.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewBirthModal}
                        className="px-4 py-2 rounded-xl bg-pink-700 text-white text-xs font-semibold shadow-xs"
                      >
                        Catat Kelahiran Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                birthEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Tgl Lahir */}
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.event_date}</span>
                      </div>
                    </td>

                    {/* Induk */}
                    <td className="py-3.5 px-4">
                      {event.sheep ? (
                        <div>
                          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-pink-50 text-pink-800 border border-pink-200">
                            {event.sheep.tag_code}
                          </span>
                          <span className="ml-2 font-bold text-slate-900">
                            {event.sheep.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-1.5">
                            ({event.sheep.breed})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Induk tidak ditemukan</span>
                      )}
                    </td>

                    {/* Jumlah Anak */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-800">
                        <Baby className="w-3 h-3" />
                        <span>{event.lamb_count || 1} Ekor</span>
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
                        aria-label="Hapus catatan kelahiran"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Hapus catatan kelahiran"
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
          <span>Menampilkan {birthEvents.length} catatan kelahiran</span>
          <span>Sinkronisasi otomatis ke Sheet 3 (Kelahiran_Tindakan)</span>
        </div>
      </div>
    </div>
  )
}
