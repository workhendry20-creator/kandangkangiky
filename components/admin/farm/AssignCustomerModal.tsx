'use client'

import { useState, useTransition, type FormEvent } from 'react'
import type { FarmSheep } from '@/types/farm-sheep'
import { assignCustomerToSheep } from '@/lib/actions/farm-sheep'
import {
  X,
  UserCheck,
  User,
  Phone,
  Scale,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

interface AssignCustomerModalProps {
  isOpen: boolean
  sheep: FarmSheep | null
  onClose: () => void
  onSuccess: () => void
}

export function AssignCustomerModal({
  isOpen,
  sheep,
  onClose,
  onSuccess,
}: AssignCustomerModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen || !sheep) return null

  const currentWeightNum = Number(sheep.current_weight || sheep.initial_weight) || 20
  const defaultTargetWeight = targetWeight || String(Math.round(currentWeightNum + 15))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedName = customerName.trim()
    if (!trimmedName) {
      setErrorMsg('Nama customer wajib diisi.')
      return
    }

    const targetNum = parseFloat(targetWeight || defaultTargetWeight)
    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMsg('Target bobot harus berupa angka lebih dari 0 kg.')
      return
    }

    startTransition(async () => {
      const res = await assignCustomerToSheep({
        farmSheepId: sheep.id,
        customerName: trimmedName,
        customerPhone: customerPhone.trim() || undefined,
        targetWeight: targetNum,
        entryDate: entryDate || undefined,
      })

      if (res.success) {
        onSuccess()
        onClose()
      } else {
        setErrorMsg(res.error || 'Gagal mengubah status domba menjadi titipan customer.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9E5D6] text-[#5C6F57] flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5 text-[#5C6F57]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Assign Domba ke Customer
              </h2>
              <p className="text-xs text-slate-500">
                Alihkan dari Stok Kandang menjadi Domba Titipan Customer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheep Summary Card */}
        <div className="p-4 rounded-2xl bg-[#EBF2E8]/60 border border-[#B1C5AA]/40 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white text-[#5C6F57] border border-[#B1C5AA]/50">
              {sheep.tag_code}
            </span>
            <span className="font-semibold text-slate-700">
              {sheep.gender} • {sheep.breed}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 text-slate-600">
            <span>Nama Domba: <strong>{sheep.name}</strong></span>
            <span>BB Terkini: <strong>{currentWeightNum} kg</strong></span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Customer */}
          <div className="space-y-1.5">
            <label htmlFor="assignCustName" className="block text-xs font-semibold text-slate-700">
              Nama Lengkap Customer / Pembeli <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="assignCustName"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Bpk. Hendry Bambang"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] transition-all"
              />
            </div>
          </div>

          {/* WhatsApp Customer */}
          <div className="space-y-1.5">
            <label htmlFor="assignCustPhone" className="block text-xs font-semibold text-slate-700">
              Nomor WhatsApp Customer <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="assignCustPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] transition-all"
              />
            </div>
          </div>

          {/* Target Bobot & Tgl Masuk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="assignTargetWeight" className="block text-xs font-semibold text-slate-700">
                Target Bobot Penggemukan (kg)
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="assignTargetWeight"
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder={String(defaultTargetWeight)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">Default: +15 kg dari BB saat ini.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="assignEntryDate" className="block text-xs font-semibold text-slate-700">
                Tgl Masuk Penitipan
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="assignEntryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-600">
            💡 Domba akan otomatis masuk ke <strong>Tab 1 (Master Domba Titipan)</strong> di dashboard Titipan & Qurban, dan customer dapat melacak progress via kode <strong>{sheep.tag_code}</strong>.
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !customerName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5C6F57] hover:bg-[#485844] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Jadikan Domba Titipan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
