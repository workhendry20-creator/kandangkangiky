'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSheep } from '@/lib/actions/sheep'
import { generateTrackingCode } from '@/lib/utils'
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  User,
  Phone,
  Scale,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

const BREED_OPTIONS = [
  'Garut Super',
  'Garut Adu',
  'Merino Silang',
  'Merino Murni',
  'Dorper F1',
  'Texel',
  'Priangan',
  'Domba Ekor Gemuk (DEG)',
  'Lainnya',
]

interface NewSheepFormProps {
  initialTrackingCode: string
  initialEntryDate: string
}

export function NewSheepForm({
  initialTrackingCode,
  initialEntryDate,
}: NewSheepFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form states
  const [trackingCode, setTrackingCode] = useState(initialTrackingCode)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [breed, setBreed] = useState(BREED_OPTIONS[0])
  const [customBreed, setCustomBreed] = useState('')
  const [gender, setGender] = useState<'Jantan' | 'Betina'>('Jantan')
  const [initialWeight, setInitialWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [entryDate, setEntryDate] = useState(initialEntryDate)
  const [status, setStatus] = useState<'Penitipan' | 'Selesai/Terkirim' | 'Terjual'>('Penitipan')

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleRegenerateCode = () => {
    setTrackingCode(generateTrackingCode())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const finalBreed = breed === 'Lainnya' ? (customBreed.trim() || 'Lainnya') : breed

    const initialNum = parseFloat(initialWeight)
    const targetNum = parseFloat(targetWeight)

    if (isNaN(initialNum) || initialNum <= 0) {
      setErrorMsg('Bobot awal harus berupa angka lebih dari 0 kg.')
      return
    }

    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMsg('Target bobot harus berupa angka lebih dari 0 kg.')
      return
    }

    if (targetNum <= initialNum) {
      setErrorMsg('Target bobot idealnya lebih tinggi dari bobot awal saat masuk.')
      return
    }

    startTransition(async () => {
      const res = await createSheep({
        tracking_code: trackingCode,
        customer_name: customerName,
        customer_phone: customerPhone,
        breed: finalBreed,
        gender,
        initial_weight: initialNum,
        target_weight: targetNum,
        entry_date: entryDate,
        status,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan data domba.')
      } else {
        setSuccessMsg(res.message || 'Data domba berhasil disimpan!')
        setTimeout(() => {
          router.push('/admin/dashboard')
          router.refresh()
        }, 1200)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-slate-800">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors p-2 -ml-2 rounded-xl hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xl">🐑</span>
            <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Kandang Kang Iky
            </span>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Header Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Registrasi Master Data Baru</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tambah Domba Titipan
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Daftarkan domba mitra untuk mulai pemantauan bobot, riwayat pakan berkala, dan kartu lacak publik customer.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Penyimpanan Gagal</p>
                <p className="text-rose-700 text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold">Berhasil!</p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  {successMsg} Mengarahkan kembali ke dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Registration Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white border border-stone-200/90 shadow-xs p-6 sm:p-8 space-y-6"
          >
            {/* SECTION 1: Tracking Code Generator */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tracking Code Domba (ID Unik)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kode ini digunakan customer untuk melacak progress di portal publik.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 text-xs font-medium shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                  title="Generate kode unik baru"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Acak Kode Baru</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  required
                  placeholder="KKY-XXXXX"
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-lg text-emerald-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 uppercase"
                />
                <span className="hidden sm:inline text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                  ✓ Format KKY-XXXXX Sesuai Standar
                </span>
              </div>
            </div>

            {/* SECTION 2: Customer Information */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-stone-100 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span>Informasi Mitra / Pemilik Domba</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Customer */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customerName"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nama Lengkap Customer <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="customerName"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: H. Hendry Kurniawan"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* No WhatsApp */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customerPhone"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    No. WhatsApp Customer
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Livestock Details */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-stone-100 flex items-center gap-2">
                <span className="text-base">🐑</span>
                <span>Spesifikasi Domba</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Breed / Ras */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="breedSelect"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Ras Domba <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="breedSelect"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
                  >
                    {BREED_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {breed === 'Lainnya' && (
                    <input
                      type="text"
                      value={customBreed}
                      onChange={(e) => setCustomBreed(e.target.value)}
                      placeholder="Ketik nama ras..."
                      required
                      className="mt-2 w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  )}
                </div>

                {/* Gender / Jenis Kelamin */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setGender('Jantan')}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        gender === 'Jantan'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'border-stone-300 bg-white text-slate-600 hover:bg-stone-50'
                      }`}
                    >
                      <span>♂</span>
                      <span>Jantan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Betina')}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        gender === 'Betina'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'border-stone-300 bg-white text-slate-600 hover:bg-stone-50'
                      }`}
                    >
                      <span>♀</span>
                      <span>Betina</span>
                    </button>
                  </div>
                </div>

                {/* BB Awal */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="initialWeight"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    BB Awal Masuk (kg) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="initialWeight"
                      type="number"
                      step="0.1"
                      min="1"
                      max="150"
                      required
                      value={initialWeight}
                      onChange={(e) => setInitialWeight(e.target.value)}
                      placeholder="Contoh: 25.0"
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                {/* Target BB */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="targetWeight"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Target Bobot Iduladha (kg) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="targetWeight"
                      type="number"
                      step="0.1"
                      min="1"
                      max="150"
                      required
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder="Contoh: 45.0"
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                {/* Tanggal Masuk */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="entryDate"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Tanggal Masuk Kandang <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="entryDate"
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Status Penitipan */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="statusSelect"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Status Awal
                  </label>
                  <select
                    id="statusSelect"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'Penitipan' | 'Selesai/Terkirim' | 'Terjual')
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
                  >
                    <option value="Penitipan">Penitipan (Dalam Perawatan)</option>
                    <option value="Selesai/Terkirim">Selesai / Terkirim</option>
                    <option value="Terjual">Terjual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 4: Submit & Cancel Actions */}
            <div className="pt-6 border-t border-stone-200/80 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <Link
                href="/admin/dashboard"
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 text-sm font-semibold transition-colors text-center"
              >
                Batal
              </Link>
              <button
                type="submit"
                id="btnSubmitNewSheep"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white text-sm font-semibold shadow-md shadow-emerald-800/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Data Domba</span>
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
