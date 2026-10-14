'use client'

import { useState, useTransition, useRef } from 'react'
import { importFarmSheepBulk } from '@/lib/actions/farm-sheep'
import type {
  CreateFarmSheepInput,
  FarmSheepGender,
  FarmSheepOrigin,
  FarmSheepStatus,
  FarmSheepType,
} from '@/types/farm-sheep'
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'

const SAMPLE_CSV = `tag_code,name,gender,breed,origin,entry_date,initial_weight,status,sheep_type,notes
DK-001,Si Cantik,Betina,Garut Super,Beli,2026-01-15,35.5,Hamil,Indukan,Sekat A1
DK-002,Bidadari,Betina,Priangan,Beli,2026-01-15,32.0,Kosongan,Indukan,Sekat A2
DK-003,Rambo,Jantan,Dorper F1,Beli,2026-02-01,55.0,Pemacek,Pejantan,Pejantan Utama
DK-004,Gondrong,Jantan,Garut Adu,Beli,2026-02-10,48.5,Pemacek,Pejantan,Sekat B1
DK-005,Mawar,Betina,Texel,Beranak,2026-02-20,28.0,Siap Kawin,Indukan,Hasil Breeding Sendiri`

interface ImportCsvModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ImportCsvModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportCsvModalProps) {
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file')
  const [rawCsvText, setRawCsvText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<CreateFarmSheepInput[]>([])
  const [copiedTemplate, setCopiedTemplate] = useState(false)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  // Function to parse CSV string into objects
  const parseCsv = (text: string) => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!text.trim()) {
      setParsedRows([])
      return
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length < 2) {
      setErrorMsg('CSV harus memiliki baris header dan minimal 1 baris data.')
      setParsedRows([])
      return
    }

    // Split headers (support comma or semicolon)
    const delimiter = lines[0].includes(';') ? ';' : ','
    const headers = lines[0]
      .split(delimiter)
      .map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase())

    const results: CreateFarmSheepInput[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue

      // Simple CSV split (respecting simple quotes)
      const values = line
        .split(delimiter)
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))

      const rowObj: Record<string, string> = {}
      headers.forEach((header, idx) => {
        rowObj[header] = values[idx] || ''
      })

      // Map to CreateFarmSheepInput
      const tagCode =
        rowObj.tag_code || rowObj.tag || rowObj.id_domba || rowObj.kode || `DK-${Date.now()}-${i}`
      const name = rowObj.name || rowObj.nama || `Domba ${tagCode}`
      const genderRaw = (rowObj.gender || rowObj.jenis_kelamin || 'Betina').toLowerCase()
      const gender: FarmSheepGender =
        genderRaw.startsWith('j') ? 'Jantan' : 'Betina'
      const breed = rowObj.breed || rowObj.jenis || rowObj.ras || 'Garut'
      const originRaw = (rowObj.origin || rowObj.asal || 'Beli').toLowerCase()
      const origin: FarmSheepOrigin = originRaw.includes('beranak') ? 'Beranak' : 'Beli'
      const entryDate =
        rowObj.entry_date ||
        rowObj.tgl_kedatangan ||
        rowObj.tanggal ||
        new Date().toISOString().split('T')[0]
      const weightRaw = parseFloat(
        rowObj.initial_weight || rowObj.bb_awal || rowObj.berat || '25'
      )
      const initialWeight = !isNaN(weightRaw) && weightRaw > 0 ? weightRaw : 25
      const status = (rowObj.status as FarmSheepStatus) || (gender === 'Betina' ? 'Kosongan' : 'Pemacek')
      const sheepType =
        (rowObj.sheep_type as FarmSheepType) ||
        (rowObj.tipe as FarmSheepType) ||
        (gender === 'Betina' ? 'Indukan' : 'Pejantan')
      const notes = rowObj.notes || rowObj.keterangan || null

      results.push({
        tag_code: tagCode,
        name,
        gender,
        breed,
        origin,
        entry_date: entryDate,
        initial_weight: initialWeight,
        current_weight: initialWeight,
        status,
        sheep_type: sheepType,
        notes,
      })
    }

    if (results.length === 0) {
      setErrorMsg('Tidak ditemukan data valid dalam file CSV.')
    } else {
      setParsedRows(results)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawCsvText(content)
      parseCsv(content)
    }
    reader.readAsText(file)
  }

  const handlePasteChange = (val: string) => {
    setRawCsvText(val)
    parseCsv(val)
  }

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV)
    setCopiedTemplate(true)
    setTimeout(() => setCopiedTemplate(false), 2000)
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'template_inventaris_kandang_kang_iky.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportSubmit = () => {
    if (parsedRows.length === 0) {
      setErrorMsg('Pilih file CSV atau tempelkan data terlebih dahulu.')
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const res = await importFarmSheepBulk(parsedRows)

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengimpor data CSV.')
      } else {
        setSuccessMsg(
          res.message || `Berhasil mengimpor ${parsedRows.length} domba ke master kandang!`
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
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#B1C5AA]/40 shadow-2xl p-5 sm:p-7 lg:p-8 my-auto text-slate-800 max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2E8] text-[#5C6F57] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#5C6F57]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Import CSV Domba Kandang
              </h2>
              <p className="text-xs text-slate-500">
                Unggah data massal dari file Excel atau Google Spreadsheet owner
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

        {/* Action Bar for Template */}
        <div className="mt-4 p-4 rounded-2xl bg-[#EBF2E8]/40 border border-[#B1C5AA]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Format Kolom Spreadsheet:</p>
            <p className="text-slate-500 font-mono text-[11px] mt-0.5">
              tag_code, name, gender, breed, origin, entry_date, initial_weight, status, sheep_type, notes
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-slate-700 hover:bg-[#EBF2E8] cursor-pointer shadow-2xs transition-colors"
            >
              {copiedTemplate ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#5C6F57]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Format</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5C6F57] bg-[#EBF2E8] text-xs font-semibold text-[#5C6F57] hover:bg-[#D9E5D6] cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .CSV</span>
            </button>
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="mt-5 flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'file'
                ? 'bg-[#5C6F57] text-white shadow-xs'
                : 'text-slate-600 hover:bg-[#EBF2E8]'
            }`}
          >
            Upload File CSV
          </button>
          <button
            type="button"
            onClick={() => setInputMode('paste')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'paste'
                ? 'bg-[#5C6F57] text-white shadow-xs'
                : 'text-slate-600 hover:bg-[#EBF2E8]'
            }`}
          >
            Paste Teks CSV
          </button>
        </div>

        {/* Input Area */}
        {inputMode === 'file' ? (
          <div className="mt-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 hover:border-[#5C6F57] rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-[#EBF2E8]/30"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {fileName ? fileName : 'Klik untuk memilih file CSV'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Format file didukung: .csv (UTF-8) dengan delimiter koma atau titik koma
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Tempelkan (Paste) Teks CSV:
            </label>
            <textarea
              rows={5}
              value={rawCsvText}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder="Paste baris data spreadsheet di sini..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-stone-300 bg-stone-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#5C6F57]"
            />
          </div>
        )}

        {/* Feedback Alerts */}
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

        {/* Preview Table */}
        {parsedRows.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Preview Data ({parsedRows.length} Domba Terdeteksi):</span>
              <span className="text-[#5C6F57] bg-[#EBF2E8] px-2 py-0.5 rounded-md border border-[#B1C5AA]">
                Siap Diimpor
              </span>
            </div>
            <div className="border border-stone-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto overflow-x-auto overscroll-x-contain">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-[#EBF2E8]/60 text-[#5C6F57] font-bold sticky top-0 border-b border-[#B1C5AA]/30">
                  <tr>
                    <th className="p-2">Tag</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Gender</th>
                    <th className="p-2">Ras</th>
                    <th className="p-2">BB Awal</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Tipe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="p-2 font-mono font-bold text-slate-900">{r.tag_code}</td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">{r.gender}</td>
                      <td className="p-2">{r.breed}</td>
                      <td className="p-2">{r.initial_weight} kg</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-[11px] font-medium">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2">{r.sheep_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-slate-700 text-xs font-semibold hover:bg-[#EBF2E8] transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleImportSubmit}
            disabled={isPending || parsedRows.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5C6F57] hover:bg-[#4d5e49] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses {parsedRows.length} data...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Simpan {parsedRows.length} Domba ke Kandang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
