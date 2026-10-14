'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Image from 'next/image'
import { createFarmSheep } from '@/lib/actions/farm-sheep'
import type {
  FarmSheepGender,
  FarmSheepOrigin,
  FarmSheepStatus,
  FarmSheepType,
} from '@/types/farm-sheep'
import {
  X,
  Plus,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react'

const BREED_OPTIONS = [
  'Garut Super',
  'Garut Adu',
  'Dorper F1 / F2',
  'Texel',
  'Priangan',
  'Merino Silang',
  'Domba Ekor Gemuk (DEG)',
  'Lainnya',
]

interface NewFarmSheepModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewFarmSheepModal({
  isOpen,
  onClose,
  onSuccess,
}: NewFarmSheepModalProps) {
  const [isPending, startTransition] = useTransition()

  // Form states
  const [tagCode, setTagCode] = useState(() => `DK-${Math.floor(100 + Math.random() * 900)}`)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<FarmSheepGender>('Betina')
  const [sheepType, setSheepType] = useState<FarmSheepType>('Indukan')
  const [breed, setBreed] = useState(BREED_OPTIONS[0])
  const [customBreed, setCustomBreed] = useState('')
  const [origin, setOrigin] = useState<FarmSheepOrigin>('Beli')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [initialWeight, setInitialWeight] = useState('')
  const [status, setStatus] = useState<FarmSheepStatus>('Kosongan')
  const [notes, setNotes] = useState('')

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenderChange = (newGender: FarmSheepGender) => {
    setGender(newGender)
    if (newGender === 'Jantan') {
      setSheepType('Pejantan')
      setStatus('Pemacek')
    } else {
      setSheepType('Indukan')
      setStatus('Kosongan')
    }
  }

  const handleRegenerateTag = () => {
    const prefix = gender === 'Jantan' ? 'PJN' : 'IND'
    setTagCode(`${prefix}-${Math.floor(100 + Math.random() * 900)}`)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const weightNum = parseFloat(initialWeight)
    if (isNaN(weightNum) || weightNum <= 0) {
      setErrorMsg('Bobot awal harus berupa angka lebih dari 0 kg.')
      return
    }

    const finalBreed = breed === 'Lainnya' ? (customBreed.trim() || 'Lainnya') : breed

    startTransition(async () => {
      const res = await createFarmSheep({
        tag_code: tagCode.trim(),
        name: name.trim(),
        gender,
        breed: finalBreed,
        origin,
        entry_date: entryDate,
        initial_weight: weightNum,
        current_weight: weightNum,
        status,
        sheep_type: sheepType,
        notes: notes.trim() || undefined,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menambahkan domba kandang.')
      } else {
        setSuccessMsg(res.message || 'Domba kandang berhasil ditambahkan!')
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1000)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-2xl p-6 sm:p-8 my-8 text-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs ring-1 ring-[#5C6F57]/20 bg-white shrink-0">
              <Image
                src="/logo.jpg"
                alt="Kandang Kang Iky Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Tambah Domba Kandang Baru
              </h2>
              <p className="text-xs text-slate-500">
                Registrasi pejantan, indukan, atau anakan internal kandang
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
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#EBF2E8] border border-[#B1C5AA] text-[#5C6F57] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C6F57] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Row 1: ID Tag & Nama Domba */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                ID Domba / Tag Ear <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={tagCode}
                  onChange={(e) => setTagCode(e.target.value)}
                  placeholder="Contoh: DK-101"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleRegenerateTag}
                  aria-label="Generate ID Baru"
                  title="Generate ID Baru"
                  className="p-2.5 rounded-xl border border-stone-300 hover:bg-[#EBF2E8] text-slate-600 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Domba <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Si Cantik / Rambo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
              />
            </div>
          </div>

          {/* Row 2: Gender & Tipe Domba */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleGenderChange('Betina')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'Betina'
                      ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-xs'
                      : 'border-stone-200 text-slate-600 hover:bg-stone-50'
                  }`}
                >
                  ♀ Betina (Indukan)
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange('Jantan')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'Jantan'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-stone-200 text-slate-600 hover:bg-stone-50'
                  }`}
                >
                  ♂ Jantan (Pejantan)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipe Domba <span className="text-rose-500">*</span>
              </label>
              <select
                value={sheepType}
                onChange={(e) => setSheepType(e.target.value as FarmSheepType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
              >
                <option value="Indukan">Indukan (Betina Produktif)</option>
                <option value="Pejantan">Pejantan (Pemacak)</option>
                <option value="Anakan">Anakan / Cempe Muda</option>
              </select>
            </div>
          </div>

          {/* Row 3: Jenis/Ras & Asal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jenis / Ras <span className="text-rose-500">*</span>
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
              >
                {BREED_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {breed === 'Lainnya' && (
                <input
                  type="text"
                  required
                  placeholder="Ketik nama ras..."
                  value={customBreed}
                  onChange={(e) => setCustomBreed(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Asal Domba <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrigin('Beli')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    origin === 'Beli'
                      ? 'border-[#5C6F57] bg-[#EBF2E8] text-[#5C6F57] shadow-xs'
                      : 'border-stone-200 text-slate-600 hover:bg-stone-50'
                  }`}
                >
                  Beli (Luar)
                </button>
                <button
                  type="button"
                  onClick={() => setOrigin('Beranak')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    origin === 'Beranak'
                      ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-xs'
                      : 'border-stone-200 text-slate-600 hover:bg-stone-50'
                  }`}
                >
                  Beranak (Kandang)
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: Tgl Kedatangan & BB Awal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tgl Kedatangan / Lahir <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                BB Awal (kg) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  required
                  value={initialWeight}
                  onChange={(e) => setInitialWeight(e.target.value)}
                  placeholder="Contoh: 35.5"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Status Reproduksi / Kondisi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Ternak <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FarmSheepStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
            >
              {gender === 'Betina' ? (
                <>
                  <option value="Kosongan">Kosongan (Siap Kawin)</option>
                  <option value="Hamil">Hamil (Bunting)</option>
                  <option value="Menyusui">Menyusui</option>
                  <option value="Kosongan/Menyusui">Kosongan / Pasca Melahirkan</option>
                  <option value="Sehat">Sehat</option>
                  <option value="Afkir">Afkir</option>
                  <option value="Terjual">Terjual</option>
                </>
              ) : (
                <>
                  <option value="Pemacek">Pemacek (Pejantan Unggul)</option>
                  <option value="Siap Kawin">Siap Kawin</option>
                  <option value="Sehat">Sehat Normal</option>
                  <option value="Afkir">Afkir</option>
                  <option value="Terjual">Terjual</option>
                </>
              )}
            </select>
          </div>

          {/* Row 6: Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan ciri khas, nomor kandang/sekat, riwayat vaksin..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5C6F57] hover:bg-[#4d5e49] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Kandang...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan Domba Kandang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
