'use client'

import { useState, useTransition, useRef, type FormEvent, type ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { createProgressLog } from '@/lib/actions/progress'
import { formatWeight, formatDate } from '@/lib/utils'
import type { Sheep } from '@/types/sheep'
import {
  ArrowLeft,
  Calendar,
  Scale,
  Activity,
  FileText,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

interface ProgressFormProps {
  sheep: Sheep
  lastWeight: number
}

const UPDATE_TYPES = ['Harian', 'Mingguan', 'Bulanan'] as const
const HEALTH_STATUSES = [
  { value: 'Sehat', label: 'Sehat & Prima', color: 'emerald' },
  { value: 'Dalam Perawatan', label: 'Dalam Perawatan', color: 'amber' },
  { value: 'Perlu Perhatian', label: 'Perlu Perhatian / Sakit', color: 'rose' },
]

export function ProgressForm({ sheep, lastWeight }: ProgressFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0])
  const [updateType, setUpdateType] = useState<(typeof UPDATE_TYPES)[number]>('Mingguan')
  const [deltaWeight, setDeltaWeight] = useState<string>('0')
  const [healthStatus, setHealthStatus] = useState('Sehat')
  const [notes, setNotes] = useState('')

  // Media Compression State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionRatio, setCompressionRatio] = useState<string | null>(null)

  // Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [sheetsSyncNote, setSheetsSyncNote] = useState<string | null>(null)

  // Handle Quick Weight Adjustments (menambah/mengurangi dari nilai delta)
  const adjustDelta = (amount: number) => {
    const val = parseFloat(deltaWeight) || 0
    const nextVal = Math.round((val + amount) * 10) / 10
    setDeltaWeight(nextVal.toString())
  }

  // Realtime calculated values
  const deltaNum = parseFloat(deltaWeight)
  const validDelta = isNaN(deltaNum) ? 0 : deltaNum
  const calculatedNewWeight = Math.round((lastWeight + validDelta) * 10) / 10

  // Handle Image Selection & Compression
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCompressing(true)
    setErrorMsg(null)

    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp',
      }
      const compressed = await imageCompression(file, options)
      setSelectedFile(compressed)

      const origKB = Math.round(file.size / 1024)
      const compKB = Math.round(compressed.size / 1024)
      const ratio = Math.round((1 - compressed.size / file.size) * 100)
      setCompressionRatio(`${origKB} KB → ${compKB} KB (-${ratio}%)`)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(URL.createObjectURL(compressed))
    } catch (err) {
      console.warn('Kompresi gambar gagal, menggunakan file asli:', err)
      setSelectedFile(file)
      setCompressionRatio(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(URL.createObjectURL(file))
    } finally {
      setIsCompressing(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setCompressionRatio(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setSheetsSyncNote(null)

    const parsedDelta = parseFloat(deltaWeight)
    if (isNaN(parsedDelta)) {
      setErrorMsg('Penambahan bobot harus berupa angka valid (misal: 0, 0.5, 1.0).')
      return
    }

    if (calculatedNewWeight <= 0) {
      setErrorMsg('Bobot terbaru domba tidak boleh kurang dari atau sama dengan 0 kg.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('sheep_id', sheep.id)
      formData.append('record_date', recordDate)
      formData.append('update_type', updateType)
      formData.append('delta_input', deltaWeight)
      formData.append('delta_weight', deltaWeight)
      formData.append('current_weight', calculatedNewWeight.toString())
      formData.append('health_status', healthStatus)
      if (notes.trim()) {
        formData.append('notes', notes.trim())
      }
      if (selectedFile) {
        formData.append('media', selectedFile)
      }

      const res = await createProgressLog(formData)

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan catatan progress.')
      } else {
        setSuccessMsg(res.message || 'Catatan progress berhasil disimpan!')
        if (res.sheetsSynced) {
          setSheetsSyncNote('Tersinkronisasi otomatis ke Google Sheets.')
        }
        setTimeout(() => {
          router.push('/admin/dashboard')
          router.refresh()
        }, 1200)
      }
    })
  }

  const totalGain = Math.round((lastWeight - sheep.initial_weight) * 100) / 100

  return (
    <div className="min-h-screen bg-[#EBF2E8] flex flex-col text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#B1C5AA]/40 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#5C6F57] transition-colors p-2 -ml-2 rounded-xl hover:bg-[#EBF2E8]/60"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-xs ring-1 ring-[#B1C5AA]/50 bg-white">
              <Image
                src="/logo.jpg"
                alt="Kandang Kang Iky"
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Input Progress Mobile
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Sheep Summary Header Card */}
          <div className="rounded-3xl bg-white border border-[#B1C5AA]/40 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#D9E5D6] text-[#5C6F57] border border-[#B1C5AA]/40 inline-block">
                  {sheep.tracking_code}
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
                  {sheep.customer_name}
                </h1>
                <p className="text-xs text-slate-500">
                  {sheep.breed} • {sheep.gender} • Masuk {formatDate(sheep.entry_date)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                  Target Bobot
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800 font-mono">
                  {formatWeight(sheep.target_weight)}
                </span>
              </div>
            </div>

            {/* Weight Progression Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100 text-center">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  BB Awal
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 font-mono">
                  {formatWeight(sheep.initial_weight)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#D9E5D6]/70 border border-[#B1C5AA]/50">
                <span className="text-[10px] uppercase font-bold text-[#5C6F57] block">
                  BB Saat Ini
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#5C6F57] font-mono">
                  {formatWeight(lastWeight)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">
                  Total Naik
                </span>
                <span className="text-xs sm:text-sm font-bold text-blue-800 font-mono">
                  {totalGain >= 0 ? `+${totalGain.toFixed(1)}` : totalGain.toFixed(1)} kg
                </span>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal Menyimpan</p>
                <p className="text-rose-700 text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-[#D9E5D6] border border-[#B1C5AA]/60 text-[#5C6F57] text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#5C6F57] mt-0.5" />
              <div>
                <p className="font-semibold">{successMsg}</p>
                {sheetsSyncNote && (
                  <p className="text-[#5C6F57] text-xs mt-0.5 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{sheetsSyncNote}</span>
                  </p>
                )}
                <p className="text-[#5C6F57] text-xs mt-1">
                  Mengarahkan kembali ke dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white border border-[#B1C5AA]/40 shadow-xs p-5 sm:p-7 space-y-6"
          >
            {/* 1. Tanggal Catatan & Jenis Update */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="recordDateInput"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Tanggal Catatan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="recordDateInput"
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] shadow-xs"
                  />
                </div>
              </div>

              {/* Jenis Update Toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Jenis Update <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {UPDATE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUpdateType(type)}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        updateType === type
                          ? 'bg-[#5C6F57] text-white shadow-xs'
                          : 'bg-stone-50 border border-stone-200 text-slate-600 hover:bg-[#EBF2E8]/40'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Penambahan Bobot (Delta Input dengan Helper Realtime) */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label
                htmlFor="deltaWeightInput"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between"
              >
                <span>PENAMBAHAN BOBOT (KG) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-slate-400">
                  BB Terakhir: {lastWeight} kg
                </span>
              </label>

              <div className="relative flex items-center">
                <Scale className="w-5 h-5 text-[#5C6F57] absolute left-4 pointer-events-none" />
                <input
                  id="deltaWeightInput"
                  type="number"
                  step="0.1"
                  required
                  value={deltaWeight}
                  onChange={(e) => setDeltaWeight(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-14 py-3.5 rounded-2xl border border-stone-300 bg-white text-2xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] shadow-xs text-center"
                />
                <span className="text-sm font-bold text-slate-400 absolute right-4 pointer-events-none">
                  kg
                </span>
              </div>

              {/* Helper text kecil di bawah input */}
              <p className="text-xs text-center font-medium text-slate-600 bg-stone-50 py-2 px-3 rounded-xl border border-stone-200/70">
                BB Saat Ini: <span className="font-bold text-slate-800">{lastWeight} kg</span>{' '}
                ➔ BB Terbaru:{' '}
                <span className="font-bold text-[#5C6F57]">
                  {calculatedNewWeight} kg
                </span>
              </p>

              {/* Quick Adjustment Buttons (-0.5 kg, +0.5 kg, +1.0 kg menambah/mengurangi dari nilai delta) */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => adjustDelta(-0.5)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                  <span>0.5 kg</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustDelta(0.5)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#B1C5AA]/60 bg-[#D9E5D6] hover:bg-[#B1C5AA]/40 text-xs font-semibold text-[#5C6F57] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>0.5 kg</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustDelta(1.0)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#B1C5AA]/60 bg-[#D9E5D6] hover:bg-[#B1C5AA]/40 text-xs font-semibold text-[#5C6F57] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>1.0 kg</span>
                </button>
              </div>
            </div>

            {/* 3. Status Kesehatan */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Kesehatan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {HEALTH_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setHealthStatus(status.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      healthStatus === status.value
                        ? status.value === 'Sehat'
                          ? 'border-[#5C6F57] bg-[#D9E5D6] text-[#5C6F57] shadow-xs'
                          : status.value === 'Dalam Perawatan'
                          ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-xs'
                          : 'border-rose-600 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-stone-200 bg-white text-slate-600 hover:bg-[#EBF2E8]/40'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{status.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Catatan Tambahan */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <label
                htmlFor="notesTextarea"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#5C6F57]" />
                <span>Catatan Tambahan (Pakan, Fisik, Obat)</span>
              </label>
              <textarea
                id="notesTextarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Nafsu makan sangat bagus, pakan konsentrat + rumput gajah, vitamin B-kompleks diberikan."
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] shadow-xs"
              />
            </div>

            {/* 5. Upload Foto dengan Kompresi Gambar WebP */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#5C6F57]" />
                  <span>Foto Domba Terkini</span>
                </span>
                <span className="text-[10px] text-[#5C6F57] font-semibold bg-[#D9E5D6] px-2 py-0.5 rounded-full">
                  Auto Kompresi WebP
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="mediaUploadInput"
              />

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-[#5C6F57] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#EBF2E8]/30 hover:bg-[#D9E5D6]/30 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-[#5C6F57] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    Ambil Foto / Pilih dari Galeri
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Otomatis dikompres &lt; 800 KB sebelum diunggah ke cloud storage
                  </p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900/5 p-2">
                  <div className="relative w-full h-56 rounded-xl overflow-hidden bg-stone-100">
                    <Image
                      src={previewUrl}
                      alt="Preview Foto Domba"
                      fill
                      sizes="(max-width: 640px) 100vw, 600px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between px-1">
                    <div className="text-xs">
                      {isCompressing ? (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengompres foto...</span>
                        </span>
                      ) : (
                        <span className="text-[#5C6F57] font-medium">
                          ✓ Siap upload {compressionRatio && `(${compressionRatio})`}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold p-1 rounded-lg hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Action Submit Buttons */}
            <div className="pt-4 border-t border-[#B1C5AA]/40 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link
                href="/admin/dashboard"
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 text-sm font-semibold transition-colors text-center"
              >
                Batal
              </Link>
              <button
                type="submit"
                id="btnSubmitProgressLog"
                disabled={isPending || isCompressing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#5C6F57] hover:bg-[#485844] active:scale-[0.99] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan & Sync Sheets...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Simpan & Sync ke Google Sheets</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
