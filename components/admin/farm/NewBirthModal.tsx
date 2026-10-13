'use client'

import React, { useState, useTransition } from 'react'
import { createFarmEvent } from '@/lib/actions/farm-sheep'
import type { FarmSheep } from '@/types/farm-sheep'
import {
  X,
  Plus,
  Calendar,
  Baby,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react'

interface NewBirthModalProps {
  sheepList: FarmSheep[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewBirthModal({
  sheepList,
  isOpen,
  onClose,
  onSuccess,
}: NewBirthModalProps) {
  const [isPending, startTransition] = useTransition()

  // Filter female sheep (indukan)
  const indukanList = sheepList.filter((s) => s.gender === 'Betina')

  const [selectedSheepId, setSelectedSheepId] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [lambCount, setLambCount] = useState('1')
  const [notes, setNotes] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const effectiveSheepId = selectedSheepId || indukanList[0]?.id || ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!effectiveSheepId) {
      setErrorMsg('Harap pilih Induk domba yang melahirkan.')
      return
    }

    const countNum = parseInt(lambCount, 10)
    if (isNaN(countNum) || countNum < 1) {
      setErrorMsg('Jumlah anak harus minimal 1 ekor.')
      return
    }

    startTransition(async () => {
      const res = await createFarmEvent({
        sheep_id: effectiveSheepId,
        event_type: 'Kelahiran',
        event_date: eventDate,
        lamb_count: countNum,
        notes: notes.trim() || undefined,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal merekam data kelahiran.')
      } else {
        setSuccessMsg(res.message || 'Catatan kelahiran berhasil disimpan!')
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1200)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-6 sm:p-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Catat Kelahiran Domba (Breeding)
              </h2>
              <p className="text-xs text-slate-500">
                Rekam kelahiran anakan (cempe) dan perbarui status induk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
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
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Notice of automatic status change */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Otomatisasi Status:</span> Status Induk yang dipilih akan otomatis diperbarui menjadi{' '}
            <span className="font-semibold underline">Kosongan/Menyusui</span> di Master Kandang dan Google Sheets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Pilih Indukan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Indukan Betina <span className="text-rose-500">*</span>
            </label>
            {indukanList.length === 0 ? (
              <p className="text-xs text-rose-600 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                Belum ada domba betina di master kandang. Silakan tambahkan domba betina terlebih dahulu.
              </p>
            ) : (
              <select
                required
                value={effectiveSheepId}
                onChange={(e) => setSelectedSheepId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-xs"
              >
                {indukanList.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.tag_code}] {s.name} - {s.breed} (Status: {s.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Row 2: Tgl Lahir & Jumlah Anak */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Lahir <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Anak (Ekor) <span className="text-rose-500">*</span>
              </label>
              <select
                value={lambCount}
                onChange={(e) => setLambCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                <option value="1">1 Ekor (Tunggal)</option>
                <option value="2">2 Ekor (Kembar 2)</option>
                <option value="3">3 Ekor (Kembar 3)</option>
                <option value="4">4 Ekor (Kembar 4)</option>
              </select>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan / Kondisi Cempe (Opsional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: 1 jantan (3.2 kg) & 1 betina (3.0 kg), proses lahiran lancar dibantu kandang, kolostrum cukup..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || indukanList.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold shadow-md shadow-pink-700/20 disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rekam Kelahiran...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan Catatan Kelahiran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
