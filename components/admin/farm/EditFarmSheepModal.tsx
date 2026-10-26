'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { updateFarmSheep } from '@/lib/actions/farm-sheep'
import type {
  FarmSheep,
  FarmSheepStatus,
  FarmSheepType,
} from '@/types/farm-sheep'
import {
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react'

interface EditFarmSheepModalProps {
  sheep: FarmSheep | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const BREED_OPTIONS = [
  'Garut',
  'Priangan',
  'Merino',
  'Dorper',
  'Cross Texel',
  'Lainnya',
]

function EditFarmSheepFormContent({
  sheep,
  onClose,
  onSuccess,
}: {
  sheep: FarmSheep
  onClose: () => void
  onSuccess?: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(sheep.name)
  const isDefaultBreed = ['Garut', 'Priangan', 'Merino', 'Dorper', 'Cross Texel'].includes(sheep.breed)
  const [breed, setBreed] = useState(isDefaultBreed ? sheep.breed : 'Lainnya')
  const [customBreed, setCustomBreed] = useState(isDefaultBreed ? '' : sheep.breed)
  const [status, setStatus] = useState<FarmSheepStatus>(sheep.status)
  const [sheepType, setSheepType] = useState<FarmSheepType>(sheep.sheep_type)
  const [currentWeight, setCurrentWeight] = useState(
    sheep.current_weight
      ? String(sheep.current_weight)
      : String(sheep.initial_weight)
  )
  const [notes, setNotes] = useState(sheep.notes || '')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const weightNum = parseFloat(currentWeight)
    if (isNaN(weightNum) || weightNum <= 0) {
      setErrorMsg('Bobot harus berupa angka lebih dari 0 kg.')
      return
    }

    if (breed === 'Lainnya') {
      const trimmedCustom = customBreed.trim()
      if (!trimmedCustom) {
        setErrorMsg('Jenis domba wajib diisi jika memilih opsi Lainnya.')
        return
      }
    }

    const finalBreed = breed === 'Lainnya' ? customBreed.trim() : breed

    startTransition(async () => {
      const res = await updateFarmSheep(sheep.id, {
        name: name.trim(),
        breed: finalBreed,
        status,
        sheep_type: sheepType,
        current_weight: weightNum,
        notes: notes.trim() || undefined,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal update data domba.')
      } else {
        setSuccessMsg(res.message || 'Data domba berhasil diperbarui!')
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 900)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-2xl p-5 sm:p-7 my-auto max-h-[92dvh] overflow-y-auto text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-[#D9E5D6] text-[#5C6F57] px-2 py-0.5 rounded-md">
                {sheep.tag_code}
              </span>
              <h2 className="text-lg font-bold text-slate-900">Edit Data Domba</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {sheep.breed} • {sheep.gender} • Masuk {sheep.entry_date}
            </p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Domba
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
            />
          </div>

          <div>
            <label
              htmlFor="editBreedSelect"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Jenis / Ras Domba <span className="text-rose-500">*</span>
            </label>
            <select
              id="editBreedSelect"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
            >
              {BREED_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {breed === 'Lainnya' && (
              <div className="mt-2 space-y-1">
                <input
                  type="text"
                  required
                  placeholder="Masukkan jenis domba..."
                  value={customBreed}
                  onChange={(e) => setCustomBreed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Ketik nama jenis domba secara spesifik.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status Terkini
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FarmSheepStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
              >
                {sheep.gender === 'Betina' ? (
                  <>
                    <option value="Kosongan">Kosongan</option>
                    <option value="Hamil">Hamil</option>
                    <option value="Menyusui">Menyusui</option>
                    <option value="Kosongan/Menyusui">Kosongan/Menyusui</option>
                    <option value="Sehat">Sehat</option>
                    <option value="Afkir">Afkir</option>
                    <option value="Terjual">Terjual</option>
                  </>
                ) : (
                  <>
                    <option value="Pemacek">Pemacek</option>
                    <option value="Siap Kawin">Siap Kawin</option>
                    <option value="Sehat">Sehat</option>
                    <option value="Afkir">Afkir</option>
                    <option value="Terjual">Terjual</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Bobot Saat Ini (kg)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipe Domba
            </label>
            <select
              value={sheepType}
              onChange={(e) => setSheepType(e.target.value as FarmSheepType)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
            >
              <option value="Indukan">Indukan</option>
              <option value="Pejantan">Pejantan</option>
              <option value="Anakan">Anakan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan / Sekat Kandang
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-600 hover:bg-[#EBF2E8] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#5C6F57] hover:bg-[#4d5e49] text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function EditFarmSheepModal({
  sheep,
  isOpen,
  onClose,
  onSuccess,
}: EditFarmSheepModalProps) {
  if (!isOpen || !sheep) return null

  return (
    <EditFarmSheepFormContent
      key={sheep.id}
      sheep={sheep}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
