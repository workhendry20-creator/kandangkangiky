'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { createFarmEvent } from '@/lib/actions/farm-sheep'
import type { FarmSheep } from '@/types/farm-sheep'
import {
  X,
  Plus,
  Calendar,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

const TREATMENT_PRESETS = [
  'Vaksinasi Anthrax / SE',
  'Pemberian Obat Cacing (Wormicide)',
  'Injeksi Vitamin B-Kompleks / ADE',
  'Cukur Bulu & Sanitasi Kulit',
  'Potong Kuku (Trimming Hoof)',
  'Pengobatan Kembung (Bloat Relief)',
  'Pengobatan Sakit Mata / Belekan',
  'Karantina & Pemeriksaan Rutin',
  'Lainnya (Tulis Manual)',
]

interface NewTreatmentModalProps {
  sheepList: FarmSheep[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewTreatmentModal({
  sheepList,
  isOpen,
  onClose,
  onSuccess,
}: NewTreatmentModalProps) {
  const [isPending, startTransition] = useTransition()

  const [selectedSheepId, setSelectedSheepId] = useState('')
  const [presetAction, setPresetAction] = useState(TREATMENT_PRESETS[0])
  const [customAction, setCustomAction] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const effectiveSheepId = selectedSheepId || sheepList[0]?.id || ''

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!effectiveSheepId) {
      setErrorMsg('Harap pilih domba yang diberikan tindakan.')
      return
    }

    const finalActionName =
      presetAction === 'Lainnya (Tulis Manual)'
        ? customAction.trim()
        : presetAction

    if (!finalActionName) {
      setErrorMsg('Nama tindakan medis wajib diisi.')
      return
    }

    startTransition(async () => {
      const res = await createFarmEvent({
        sheep_id: effectiveSheepId,
        event_type: 'Tindakan',
        action_name: finalActionName,
        event_date: eventDate,
        notes: notes.trim() || undefined,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan rekam tindakan.')
      } else {
        setSuccessMsg(res.message || 'Tindakan medis berhasil dicatat!')
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1200)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-2xl p-5 sm:p-7 my-auto max-h-[92dvh] overflow-y-auto text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Rekam Medis & Tindakan Kandang
              </h2>
              <p className="text-xs text-slate-500">
                Catat vaksinasi, vitamin, obat cacing, potong kuku, & perawatan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#EBF2E8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-[#EBF2E8] border border-[#B1C5AA] text-[#5C6F57] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C6F57] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Pilih Domba */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Domba Sasaran <span className="text-rose-500">*</span>
            </label>
            {sheepList.length === 0 ? (
              <p className="text-xs text-rose-600 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                Belum ada domba di master kandang.
              </p>
            ) : (
              <select
                required
                value={effectiveSheepId}
                onChange={(e) => setSelectedSheepId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
              >
                {sheepList.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.tag_code}] {s.name} - {s.gender} ({s.breed})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Nama Tindakan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis / Nama Tindakan <span className="text-rose-500">*</span>
            </label>
            <select
              value={presetAction}
              onChange={(e) => setPresetAction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
            >
              {TREATMENT_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {presetAction === 'Lainnya (Tulis Manual)' && (
              <input
                type="text"
                required
                placeholder="Tuliskan nama tindakan medis..."
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                className="mt-2 w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
              />
            )}
          </div>

          {/* Tanggal Tindakan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal Tindakan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan Obat, Dosis & Pelaksana
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Diberi Albendazole 10ml per oral oleh Mantri Joko, kondisi domba aktif setelah observasi..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-[#EBF2E8] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || sheepList.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rekam Tindakan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan Rekam Tindakan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
