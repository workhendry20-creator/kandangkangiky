'use client'

import { useState, useTransition, useMemo, type FormEvent } from 'react'
import { createFarmEvent } from '@/lib/actions/farm-sheep'
import { buildBirthDescription } from '@/lib/utils'
import type { FarmSheep, FarmSheepGender } from '@/types/farm-sheep'
import {
  X,
  Plus,
  Calendar,
  Baby,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Sparkles,
  ShieldCheck,
  Tag,
  Scale,
} from 'lucide-react'

interface NewBirthModalProps {
  sheepList: FarmSheep[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface LambFormItem {
  tag_code: string
  name: string
  gender: FarmSheepGender
  weight: string
}

export function NewBirthModal({
  sheepList,
  isOpen,
  onClose,
  onSuccess,
}: NewBirthModalProps) {
  const [isPending, startTransition] = useTransition()

  // 1. Filter female sheep (indukan) and male sheep (pejantan)
  const indukanList = useMemo(
    () => sheepList.filter((s) => s.gender === 'Betina' || s.sheep_type === 'Indukan'),
    [sheepList]
  )

  const pejantanList = useMemo(
    () => sheepList.filter((s) => s.gender === 'Jantan' || s.sheep_type === 'Pejantan'),
    [sheepList]
  )

  // Form State
  const [selectedSheepId, setSelectedSheepId] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [lambCount, setLambCount] = useState('1')

  // Sire (Pejantan / Bapak) state
  const [sireTag, setSireTag] = useState('')
  const [sireName, setSireName] = useState('')

  // Dynamic Lambs state (1 - 5 ekor)
  const [lambs, setLambs] = useState<LambFormItem[]>([
    { tag_code: '', name: '', gender: 'Jantan', weight: '' },
  ])

  // Auto-register cempe to farm_sheep toggle
  const [autoRegisterLambs, setAutoRegisterLambs] = useState(true)

  // Additional general notes
  const [notes, setNotes] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const effectiveSheepId = selectedSheepId || indukanList[0]?.id || ''
  const selectedInduk = indukanList.find((s) => s.id === effectiveSheepId)

  // Check if current Sire inputs match any ram in farm database
  const matchedSire = (() => {
    const trimmedTag = sireTag.trim().toLowerCase()
    const trimmedName = sireName.trim().toLowerCase()
    if (!trimmedTag && !trimmedName) return null
    return pejantanList.find(
      (p) =>
        (trimmedTag && p.tag_code.trim().toLowerCase() === trimmedTag) ||
        (trimmedName && p.name.trim().toLowerCase() === trimmedName)
    )
  })()

  // Handle Sire Tag input with Auto-lookup match
  const handleSireTagChange = (val: string) => {
    setSireTag(val)
    const trimmed = val.trim().toLowerCase()
    if (!trimmed) return
    const match = pejantanList.find(
      (p) => p.tag_code.trim().toLowerCase() === trimmed
    )
    if (match) {
      setSireName(match.name)
    }
  }

  // Handle Sire Name input with Auto-lookup match
  const handleSireNameChange = (val: string) => {
    setSireName(val)
    const trimmed = val.trim().toLowerCase()
    if (!trimmed) return
    const match = pejantanList.find(
      (p) => p.name.trim().toLowerCase() === trimmed
    )
    if (match) {
      setSireTag(match.tag_code)
    }
  }

  // Quick picker for registered pejantan
  const handleSelectQuickPejantan = (sheepId: string) => {
    if (!sheepId) return
    const match = pejantanList.find((p) => p.id === sheepId)
    if (match) {
      setSireTag(match.tag_code)
      setSireName(match.name)
    }
  }

  // Handle Jumlah Anak change (1 - 5 ekor)
  const handleLambCountChange = (val: string) => {
    setLambCount(val)
    const count = parseInt(val, 10) || 1
    const clampedCount = Math.min(5, Math.max(1, count))
    setLambs((prev) => {
      const updated = [...prev]
      if (updated.length < clampedCount) {
        for (let i = updated.length; i < clampedCount; i++) {
          updated.push({
            tag_code: '',
            name: '',
            gender: i % 2 === 0 ? 'Jantan' : 'Betina',
            weight: '',
          })
        }
      } else if (updated.length > clampedCount) {
        return updated.slice(0, clampedCount)
      }
      return updated
    })
  }

  // Update specific lamb field
  const updateLambField = (
    index: number,
    field: keyof LambFormItem,
    value: string
  ) => {
    setLambs((prev) => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }

  // Auto-fill default lamb tag codes based on Induk tag
  const handleAutoFillLambTags = () => {
    const cleanInduk = (selectedInduk?.tag_code || 'DK').replace(/[^a-zA-Z0-9]/g, '')
    setLambs((prev) =>
      prev.map((lamb, idx) => ({
        ...lamb,
        tag_code: lamb.tag_code.trim() || `CMP-${cleanInduk}-${idx + 1}`,
      }))
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!effectiveSheepId) {
      setErrorMsg('Harap pilih Induk domba yang melahirkan.')
      return
    }

    const countNum = parseInt(lambCount, 10)
    if (isNaN(countNum) || countNum < 1 || countNum > 5) {
      setErrorMsg('Jumlah anak harus minimal 1 dan maksimal 5 ekor.')
      return
    }

    const cleanInduk = (selectedInduk?.tag_code || 'DK').replace(/[^a-zA-Z0-9]/g, '')

    // Prepare processed lambs list
    const processedLambs = lambs.slice(0, countNum).map((lamb, idx) => {
      const parsedWeight = parseFloat(lamb.weight)
      return {
        tag_code:
          lamb.tag_code.trim() ||
          `CMP-${cleanInduk}-${Date.now().toString().slice(-4)}${idx + 1}`,
        name:
          lamb.name.trim() ||
          `Cempe ${selectedInduk?.name || 'Induk'} #${idx + 1}`.trim(),
        gender: lamb.gender,
        weight: !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : 3.0,
      }
    })

    // Format structured notes
    const structuredNotes = buildBirthDescription({
      sireTag: sireTag.trim() || undefined,
      sireName: sireName.trim() || undefined,
      lambs: processedLambs,
      userNotes: notes.trim() || undefined,
    })

    startTransition(async () => {
      const res = await createFarmEvent({
        sheep_id: effectiveSheepId,
        event_type: 'Kelahiran',
        event_date: eventDate,
        lamb_count: countNum,
        action_name: `Kelahiran (${countNum} Ekor)`,
        notes: structuredNotes,
        sire_tag: sireTag.trim() || null,
        sire_name: sireName.trim() || null,
        lambs: processedLambs,
        auto_register_lambs: autoRegisterLambs,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal merekam data kelahiran.')
      } else {
        setSuccessMsg(
          res.message ||
            `Catatan kelahiran (${countNum} ekor cempe) berhasil disimpan!`
        )
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1200)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl lg:max-w-2xl bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-2xl p-5 sm:p-7 lg:p-8 my-auto max-h-[92dvh] overflow-y-auto text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold shadow-xs">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Catat Kelahiran Domba (Breeding)
              </h2>
              <p className="text-xs text-slate-500">
                Rekam kelahiran cempe baru, data bapak/pejantan, dan perbarui status induk
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
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#EBF2E8] border border-[#B1C5AA] text-[#5C6F57] text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#5C6F57] shrink-0" />
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
          {/* 1. Pilih Indukan */}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57] shadow-xs"
              >
                {indukanList.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.tag_code}] {s.name} - {s.breed} (Status: {s.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Section Pejantan (Bapak / Sire) - Free Text & Auto-Suggest Sync */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-stone-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-stone-200/60">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#5C6F57]" />
                  Pejantan (Bapak / Sire)
                </span>
                <p className="text-[11px] text-slate-500">
                  Teks bebas (mendukung pacokan luar) dengan auto-sync otomatis jika ada di kandang
                </p>
              </div>

              {pejantanList.length > 0 && (
                <div className="sm:self-end">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      handleSelectQuickPejantan(e.target.value)
                      e.target.value = ''
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-slate-600 hover:border-[#5C6F57] cursor-pointer"
                  >
                    <option value="" disabled>
                      ⚡ Pilih Cepat Pejantan Kandang ({pejantanList.length})
                    </option>
                    {pejantanList.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.tag_code}] {p.name} ({p.breed})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Datalists for native browser autocomplete suggestions */}
            <datalist id="pejantan-tag-suggestions">
              {pejantanList.map((p) => (
                <option key={`tag-${p.id}`} value={p.tag_code}>
                  {p.name} ({p.breed})
                </option>
              ))}
            </datalist>

            <datalist id="pejantan-name-suggestions">
              {pejantanList.map((p) => (
                <option key={`name-${p.id}`} value={p.name}>
                  [{p.tag_code}] ({p.breed})
                </option>
              ))}
            </datalist>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ID Domba Jantan (Tag Bapak)
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    list="pejantan-tag-suggestions"
                    value={sireTag}
                    onChange={(e) => handleSireTagChange(e.target.value)}
                    placeholder="Contoh: DK-J-01 atau pacokan luar"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nama Domba Jantan (Nama Bapak)
                </label>
                <input
                  type="text"
                  list="pejantan-name-suggestions"
                  value={sireName}
                  onChange={(e) => handleSireNameChange(e.target.value)}
                  placeholder="Contoh: Barokah atau Si Samson"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
                />
              </div>
            </div>

            {/* Match status feedback pill */}
            <div className="pt-1">
              {matchedSire ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Terdaftar di Kandang: <strong>[{matchedSire.tag_code}] {matchedSire.name}</strong> ({matchedSire.breed})
                  </span>
                </span>
              ) : sireTag.trim() || sireName.trim() ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                  <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Pejantan Pacokan Luar / Entri Bebas (Tidak ada di database kandang)</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Ketik ID atau Nama pejantan untuk auto-sync, atau biarkan kosong jika belum tercatat.
                </span>
              )}
            </div>
          </div>

          {/* 3. Row Tgl Lahir & Opsi Jumlah Anak (Hingga 5 Ekor) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Anak (Ekor) <span className="text-rose-500">*</span>
              </label>
              <select
                value={lambCount}
                onChange={(e) => handleLambCountChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
              >
                <option value="1">1 Ekor (Tunggal)</option>
                <option value="2">2 Ekor (Kembar 2)</option>
                <option value="3">3 Ekor (Kembar 3)</option>
                <option value="4">4 Ekor (Kembar 4)</option>
                <option value="5">5 Ekor (Kembar 5)</option>
              </select>
            </div>
          </div>

          {/* 4. Dynamic Section: Data Anak / Cempe */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-pink-600" />
                Data Anak / Cempe ({lambs.length} Ekor)
              </label>
              <button
                type="button"
                onClick={handleAutoFillLambTags}
                className="inline-flex items-center gap-1 text-xs font-semibold text-pink-700 hover:text-pink-800 hover:underline transition-colors"
                title="Isi otomatis format tag cempe berdasarkan tag induk"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                <span>Auto-Isi Tag</span>
              </button>
            </div>

            {/* Dynamic cards for each lamb */}
            <div className="space-y-2.5">
              {lambs.map((lamb, idx) => (
                <div
                  key={`lamb-card-${idx}`}
                  className="p-3.5 rounded-2xl border border-pink-200/70 bg-gradient-to-r from-pink-50/40 via-stone-50/50 to-white space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-800 bg-pink-100/80 px-2.5 py-0.5 rounded-lg">
                      <Baby className="w-3 h-3 text-pink-700" />
                      Anak #{idx + 1}
                    </span>

                    {/* Gender toggle buttons */}
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200">
                      <button
                        type="button"
                        onClick={() => updateLambField(idx, 'gender', 'Jantan')}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                          lamb.gender === 'Jantan'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-blue-700'
                        }`}
                      >
                        Jantan ♂
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLambField(idx, 'gender', 'Betina')}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                          lamb.gender === 'Betina'
                            ? 'bg-pink-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-pink-700'
                        }`}
                      >
                        Betina ♀
                      </button>
                    </div>
                  </div>

                  {/* 3 fields grid: Tag, Name, Bobot Lahir */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* ID / Tag Cempe */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        ID / Tag Cempe
                      </label>
                      <div className="relative">
                        <Tag className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={lamb.tag_code}
                          onChange={(e) => updateLambField(idx, 'tag_code', e.target.value)}
                          placeholder={`CMP-${(selectedInduk?.tag_code || 'DK').replace(/[^a-zA-Z0-9]/g, '')}-${idx + 1}`}
                          className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
                        />
                      </div>
                    </div>

                    {/* Nama Cempe */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Nama Cempe (Opsional)
                      </label>
                      <input
                        type="text"
                        value={lamb.name}
                        onChange={(e) => updateLambField(idx, 'name', e.target.value)}
                        placeholder={`Cempe ${selectedInduk?.name || ''} #${idx + 1}`.trim()}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
                      />
                    </div>

                    {/* Bobot Lahir */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Bobot Lahir (kg)
                      </label>
                      <div className="relative">
                        <Scale className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="15"
                          value={lamb.weight}
                          onChange={(e) => updateLambField(idx, 'weight', e.target.value)}
                          placeholder="3.2"
                          className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkbox Auto-Register Cempe ke Master Kandang */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#EBF2E8]/70 border border-[#B1C5AA]/70 cursor-pointer hover:bg-[#EBF2E8] transition-colors">
              <input
                type="checkbox"
                checked={autoRegisterLambs}
                onChange={(e) => setAutoRegisterLambs(e.target.checked)}
                className="mt-0.5 rounded text-[#5C6F57] focus:ring-[#5C6F57] w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-[#5C6F57]">
                  Otomatis daftarkan anakan ke Master Domba (farm_sheep)
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Cempe akan langsung tercatat sebagai domba dengan tipe Anakan, status Sehat, asal Beranak, dan ras mewarisi Indukan ({selectedInduk?.breed || 'Garut'}).
                </p>
              </div>
            </label>
          </div>

          {/* 5. Keterangan / Kondisi Cempe */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan / Kondisi Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Proses lahiran lancar dibantu kandang, kolostrum cukup, induk dan anakan sehat..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-[#EBF2E8] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || indukanList.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
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
