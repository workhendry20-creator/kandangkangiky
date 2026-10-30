'use client'

import { useState, useEffect, useTransition, type FormEvent } from 'react'
import Image from 'next/image'
import { createFarmSheep } from '@/lib/actions/farm-sheep'
import {
  getNextTrackingCode,
  checkTrackingCodeAvailability,
} from '@/lib/actions/sheep'
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
  Target,
} from 'lucide-react'

const BREED_OPTIONS = [
  'Garut',
  'Priangan',
  'Merino',
  'Dorper',
  'Cross Texel',
  'Lainnya',
]

interface NewFarmSheepModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialTrackingCode?: string
}

export function NewFarmSheepModal({
  isOpen,
  onClose,
  onSuccess,
  initialTrackingCode,
}: NewFarmSheepModalProps) {
  const [isPending, startTransition] = useTransition()

  // Form states with universal KKY-XXXX ID
  const [recommendedCode, setRecommendedCode] = useState(initialTrackingCode || 'KKY-0001')
  const [tagCode, setTagCode] = useState(initialTrackingCode || 'KKY-0001')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<FarmSheepGender>('Betina')
  const [sheepType, setSheepType] = useState<FarmSheepType>('Indukan')
  const [breed, setBreed] = useState(BREED_OPTIONS[0])
  const [customBreed, setCustomBreed] = useState('')
  const [origin, setOrigin] = useState<FarmSheepOrigin>('Beli')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [initialWeight, setInitialWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [status, setStatus] = useState<FarmSheepStatus>('Kosongan')
  const [notes, setNotes] = useState('')

  // Validation & Availability states
  const [isLoadingCode, setIsLoadingCode] = useState(false)
  const [isRefreshingCode, setIsRefreshingCode] = useState(false)
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Fetch highest sequential KKY-XXXX code when modal opens
  useEffect(() => {
    if (isOpen) {
      let isMounted = true
      setIsLoadingCode(true)
      getNextTrackingCode()
        .then((nextCode) => {
          if (isMounted && nextCode) {
            setRecommendedCode(nextCode)
            setTagCode(nextCode)
            setIsDuplicate(false)
            setDuplicateMessage(null)
          }
        })
        .catch((err) => {
          console.warn('[NewFarmSheepModal] Error fetching initial tracking code:', err)
        })
        .finally(() => {
          if (isMounted) setIsLoadingCode(false)
        })
      return () => {
        isMounted = false
      }
    }
  }, [isOpen])

  // Real-time debounce check for manual tagCode input
  useEffect(() => {
    const cleanCode = tagCode.trim().toUpperCase()
    if (!cleanCode) {
      setIsDuplicate(false)
      setDuplicateMessage(null)
      setIsCheckingCode(false)
      return
    }

    setIsCheckingCode(true)
    const timer = setTimeout(async () => {
      try {
        const res = await checkTrackingCodeAvailability(cleanCode)
        if (!res.available) {
          setIsDuplicate(true)
          setDuplicateMessage(res.message || 'Kode ID ini sudah terdaftar!')
        } else {
          setIsDuplicate(false)
          setDuplicateMessage(null)
        }
      } catch (err) {
        console.warn('[NewFarmSheepModal] Error validating tracking code:', err)
      } finally {
        setIsCheckingCode(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [tagCode])

  const handleBlurCode = async () => {
    const cleanCode = tagCode.trim().toUpperCase()
    if (!cleanCode) return
    setIsCheckingCode(true)
    try {
      const res = await checkTrackingCodeAvailability(cleanCode)
      if (!res.available) {
        setIsDuplicate(true)
        setDuplicateMessage(res.message || 'Kode ID ini sudah terdaftar!')
      } else {
        setIsDuplicate(false)
        setDuplicateMessage(null)
      }
    } catch (err) {
      console.warn('[NewFarmSheepModal] Error on blur validate:', err)
    } finally {
      setIsCheckingCode(false)
    }
  }

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

  const handleRegenerateTag = async () => {
    setIsRefreshingCode(true)
    try {
      const nextCode = await getNextTrackingCode()
      setRecommendedCode(nextCode)
      setTagCode(nextCode)
      setIsDuplicate(false)
      setDuplicateMessage(null)
    } catch (err) {
      console.warn('[NewFarmSheepModal] Error fetching next tracking code:', err)
    } finally {
      setIsRefreshingCode(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (isDuplicate) {
      setErrorMsg('Kode ID domba ini sudah terdaftar! Silakan gunakan kode lain atau ikuti rekomendasi.')
      return
    }

    if (!tagCode.trim()) {
      setErrorMsg('ID / Tag domba wajib diisi.')
      return
    }

    const weightNum = parseFloat(initialWeight)
    if (isNaN(weightNum) || weightNum <= 0) {
      setErrorMsg('Bobot awal harus berupa angka lebih dari 0 kg.')
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
    const targetNum = targetWeight && !isNaN(parseFloat(targetWeight)) ? parseFloat(targetWeight) : undefined

    startTransition(async () => {
      const res = await createFarmSheep({
        tag_code: tagCode.trim().toUpperCase(),
        name: name.trim(),
        gender,
        breed: finalBreed,
        origin,
        entry_date: entryDate,
        initial_weight: weightNum,
        current_weight: weightNum,
        target_weight: targetNum,
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg lg:max-w-2xl bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-2xl p-5 sm:p-7 lg:p-8 my-auto max-h-[92dvh] overflow-y-auto">
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
                  onChange={(e) => setTagCode(e.target.value.toUpperCase())}
                  onBlur={handleBlurCode}
                  placeholder={recommendedCode || "KKY-0001"}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold tracking-wider focus:outline-none uppercase transition-all shadow-xs ${
                    isDuplicate
                      ? 'border-red-500 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                      : 'border-stone-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleRegenerateTag}
                  disabled={isRefreshingCode || isLoadingCode}
                  aria-label="Generate ID Baru"
                  title="Generate ID Baru (Rekomendasi berikutnya)"
                  className="p-2.5 rounded-xl border border-stone-300 hover:bg-[#EBF2E8] text-slate-600 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingCode || isLoadingCode ? 'animate-spin text-[#5C6F57]' : ''}`} />
                </button>
              </div>

              {/* UI Badge & Validation */}
              <div className="mt-2 min-h-6 flex items-center">
                {isCheckingCode || isLoadingCode ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5C6F57]" />
                    <span>Memeriksa ID...</span>
                  </span>
                ) : isDuplicate ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-100 px-2.5 py-1 rounded-lg border border-red-300 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>⚠️ Kode ID ini sudah terdaftar!</span>
                  </span>
                ) : tagCode.trim().toUpperCase() === recommendedCode.trim().toUpperCase() ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#5C6F57] font-semibold bg-[#D9E5D6] px-2.5 py-1 rounded-lg border border-[#B1C5AA]/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5C6F57] shrink-0" />
                    <span>✓ Rekomendasi ID selanjutnya: {recommendedCode}</span>
                  </span>
                ) : tagCode.trim() ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#5C6F57] font-semibold bg-[#D9E5D6] px-2.5 py-1 rounded-lg border border-[#B1C5AA]/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5C6F57] shrink-0" />
                    <span>✓ Kode ID tersedia</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <span>⚠️ Kode ID wajib diisi</span>
                  </span>
                )}
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
              <label
                htmlFor="farmBreedSelect"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Jenis / Ras Domba <span className="text-rose-500">*</span>
              </label>
              <select
                id="farmBreedSelect"
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

          {/* Row 4: Tgl Kedatangan & Status Reproduksi */}
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
          </div>

          {/* Row 5: BB Awal (KG) & Target Bobot (KG) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Bobot (kg)
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="Contoh: 50.0 (Opsional)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
                />
              </div>
            </div>
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
              disabled={isPending || isDuplicate || isCheckingCode || !tagCode.trim()}
              title={isDuplicate ? 'Kode ID ini sudah terdaftar!' : undefined}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5C6F57] hover:bg-[#4d5e49] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
