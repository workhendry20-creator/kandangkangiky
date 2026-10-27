'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { formatWeight, formatDate } from '@/lib/utils'
import type { Sheep, SheepSold } from '@/types/sheep'
import {
  Search,
  Plus,
  ExternalLink,
  ClipboardList,
  Copy,
  Check,
  TrendingUp,
  X,
  Phone,
} from 'lucide-react'

interface SheepTableProps {
  initialSheep: Sheep[]
  soldSheep?: SheepSold[]
}

export function SheepTable({ initialSheep, soldSheep = [] }: SheepTableProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Listen to URL parameter e.g. ?tab=completed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'completed' || tab === 'terjual' || tab === 'selesai') {
        setActiveTab('completed')
      }
    }
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode(null)
    }, 1500)
  }

  // Set of sold tracking codes and IDs to strictly guarantee sold sheep never leak into Tab 1
  const soldCodesSet = useMemo(() => {
    return new Set(soldSheep.map((s) => s.tracking_code))
  }, [soldSheep])

  const soldIdsSet = useMemo(() => {
    return new Set(soldSheep.map((s) => s.original_sheep_id))
  }, [soldSheep])

  // Active sheep list with sold exclusion
  const activeSheepList = useMemo(() => {
    return initialSheep.filter(
      (s) =>
        !soldCodesSet.has(s.tracking_code) &&
        !soldIdsSet.has(s.id) &&
        s.status !== 'Terjual' &&
        s.status !== 'Selesai'
    )
  }, [initialSheep, soldCodesSet, soldIdsSet])

  // Count metrics for tabs
  const activeCount = activeSheepList.length
  const completedCount = soldSheep.length

  // Filter active sheep based on search query
  const filteredActiveSheep = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return activeSheepList

    return activeSheepList.filter((item) => {
      return (
        item.tracking_code.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        (item.customer_phone && item.customer_phone.includes(q))
      )
    })
  }, [activeSheepList, searchQuery])

  // Filter sold sheep based on search query
  const filteredSoldSheep = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return soldSheep

    return soldSheep.filter((item) => {
      return (
        item.tracking_code.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        (item.customer_phone && item.customer_phone.includes(q))
      )
    })
  }, [soldSheep, searchQuery])

  const currentListLength =
    activeTab === 'active' ? filteredActiveSheep.length : filteredSoldSheep.length
  const baseListLength =
    activeTab === 'active' ? activeSheepList.length : soldSheep.length

  return (
    <div className="rounded-3xl bg-white border border-[#B1C5AA]/40 shadow-xs overflow-hidden">
      {/* 2 Navigation Tabs */}
      <div className="flex border-b border-[#B1C5AA]/40 bg-[#EBF2E8]/40 px-4 sm:px-6 pt-3 gap-2">
        <button
          type="button"
          id="tabMasterTitipan"
          onClick={() => {
            setActiveTab('active')
          }}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'border-[#5C6F57] text-[#5C6F57] bg-white rounded-t-xl shadow-2xs font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50 rounded-t-xl'
          }`}
        >
          <span>🐑 Master Domba Titipan</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'active'
                ? 'bg-[#EBF2E8] text-[#5C6F57]'
                : 'bg-stone-200 text-slate-600'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          id="tabDombaTerjual"
          onClick={() => {
            setActiveTab('completed')
          }}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'border-amber-600 text-amber-800 bg-white rounded-t-xl shadow-2xs font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50 rounded-t-xl'
          }`}
        >
          <span>✓ Domba Terjual / Selesai</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'completed'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-stone-200 text-slate-600'
            }`}
          >
            {completedCount}
          </span>
        </button>
      </div>

      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-[#B1C5AA]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {activeTab === 'active'
                ? 'Master Data Domba Titipan'
                : 'Domba Terjual / Selesai Masa Penitipan'}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                activeTab === 'active'
                  ? 'bg-[#D9E5D6] text-[#5C6F57] border-[#B1C5AA]/40'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {currentListLength} Ekor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'active'
              ? 'Daftar ternak mitra dalam masa penggemukan dan perawatan aktif.'
              : 'Daftar riwayat domba yang telah selesai masa penitipan atau telah lunas terjual.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input (Tracking Code / Nama Customer) */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="searchSheepInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode ID / nama customer..."
              className="w-full sm:w-72 pl-9 pr-8 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#89A482]/20 focus:border-[#89A482] shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add New Sheep Button (Active in Tab 1) */}
          {activeTab === 'active' && (
            <Link
              href="/admin/sheep/new"
              id="btnAddNewSheepTop"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5C6F57] hover:bg-[#485844] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Domba</span>
            </Link>
          )}
        </div>
      </div>

      {/* Table Data or Empty State */}
      {baseListLength === 0 ? (
        /* Empty Database State for Active Tab */
        <div className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#D9E5D6] text-[#5C6F57] text-3xl flex items-center justify-center mx-auto border border-[#B1C5AA]/40">
            {activeTab === 'active' ? '🐑' : '✓'}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'active'
                ? 'Belum Ada Domba Titipan Aktif'
                : 'Belum Ada Domba Terjual / Selesai'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'active'
                ? 'Database domba penitipan aktif masih kosong. Daftarkan domba titipan baru untuk mulai memantau perkembangan bobot.'
                : 'Domba yang telah menyelesaikan masa penitipan atau telah terjual akan otomatis terarsip di tabel sheep_sold dan tampil di sini.'}
            </p>
          </div>
          {activeTab === 'active' && (
            <Link
              href="/admin/sheep/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5C6F57] hover:bg-[#485844] text-white text-sm font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Daftarkan Domba Pertama</span>
            </Link>
          )}
        </div>
      ) : currentListLength === 0 ? (
        /* Empty Search Results State */
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Tidak Ada Domba yang Cocok
            </h3>
            <p className="text-xs text-slate-500">
              Pencarian untuk &ldquo;{searchQuery}&rdquo; tidak menemukan hasil di tab ini.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50 cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      ) : activeTab === 'active' ? (
        /* Table View Tab 1: Active Sheep */
        <div className="overflow-x-auto overscroll-x-contain w-full">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="bg-[#EBF2E8]/60 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-[#B1C5AA]/40">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Tracking Code</th>
                <th className="py-3.5 px-4 sm:px-6">Nama Customer</th>
                <th className="py-3.5 px-4 sm:px-6">Ras & Gender</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">BB Awal</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">BB Saat Ini</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Target BB</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredActiveSheep.map((sheep) => {
                const currentWeight = sheep.current_weight ?? sheep.initial_weight
                const weightGain = currentWeight - sheep.initial_weight

                return (
                  <tr
                    key={sheep.id}
                    className="hover:bg-[#EBF2E8]/30 transition-colors group"
                  >
                    {/* Tracking Code */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/track/${sheep.tracking_code}`}
                          className="font-mono font-bold text-[#5C6F57] hover:underline hover:text-[#485844] text-xs sm:text-sm tracking-wide"
                          title="Lihat portal lacak publik"
                        >
                          {sheep.tracking_code}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(sheep.tracking_code)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Salin kode tracking"
                        >
                          {copiedCode === sheep.tracking_code ? (
                            <Check className="w-3.5 h-3.5 text-[#5C6F57]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Masuk: {formatDate(sheep.entry_date)}
                      </span>
                    </td>

                    {/* Nama Customer & Phone */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {sheep.customer_name}
                      </div>
                      {sheep.customer_phone ? (
                        <a
                          href={`https://wa.me/${sheep.customer_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#5C6F57] mt-0.5"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone className="w-3 h-3 text-[#5C6F57]" />
                          <span>{sheep.customer_phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>

                    {/* Ras & Gender */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="text-xs sm:text-sm text-slate-800 font-medium">
                        {sheep.breed}
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            sheep.gender === 'Jantan'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          <span>{sheep.gender === 'Jantan' ? '♂' : '♀'}</span>
                          <span>{sheep.gender}</span>
                        </span>
                      </div>
                    </td>

                    {/* BB Awal */}
                    <td className="py-4 px-4 sm:px-6 text-right font-mono text-xs sm:text-sm text-slate-600">
                      {formatWeight(sheep.initial_weight)}
                    </td>

                    {/* BB Saat Ini */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="font-mono font-bold text-xs sm:text-sm text-[#5C6F57]">
                        {formatWeight(currentWeight)}
                      </div>
                      {weightGain > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#5C6F57]">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span>+{weightGain.toFixed(1)} kg</span>
                        </span>
                      ) : weightGain < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600">
                          <span>{weightGain.toFixed(1)} kg</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">stabil</span>
                      )}
                    </td>

                    {/* Target BB */}
                    <td className="py-4 px-4 sm:px-6 text-right font-mono text-xs sm:text-sm text-slate-600">
                      {formatWeight(sheep.target_weight)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D9E5D6] text-[#5C6F57] border border-[#B1C5AA]/60">
                        {sheep.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/admin/sheep/${sheep.id}/progress`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EBF2E8] hover:bg-[#D9E5D6] text-[#5C6F57] text-xs font-semibold border border-[#B1C5AA]/50 transition-colors"
                          title="Input log progress berkala"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">+ Log Progress</span>
                          <span className="sm:hidden">+ Log</span>
                        </Link>

                        <Link
                          href={`/track/${sheep.tracking_code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-slate-600 text-xs font-medium transition-colors"
                          title="Buka tampilan lacak publik customer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Detail</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Table View Tab 2: Sold Sheep (from sheep_sold table) */
        <div className="overflow-x-auto overscroll-x-contain w-full">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="bg-[#EBF2E8]/60 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-[#B1C5AA]/40">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Tracking Code</th>
                <th className="py-3.5 px-4 sm:px-6">Nama Customer</th>
                <th className="py-3.5 px-4 sm:px-6">Ras & Gender</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">BB Awal</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">BB Akhir</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Tanggal Terjual</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSoldSheep.map((sheep) => {
                const weightGain = sheep.final_weight - sheep.initial_weight

                return (
                  <tr
                    key={sheep.id}
                    className="hover:bg-amber-50/40 transition-colors group"
                  >
                    {/* Tracking Code */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/track/${sheep.tracking_code}`}
                          className="font-mono font-bold text-amber-900 hover:underline hover:text-amber-800 text-xs sm:text-sm tracking-wide"
                          title="Lihat portal lacak publik"
                        >
                          {sheep.tracking_code}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(sheep.tracking_code)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Salin kode tracking"
                        >
                          {copiedCode === sheep.tracking_code ? (
                            <Check className="w-3.5 h-3.5 text-amber-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Masuk: {formatDate(sheep.entry_date)}
                      </span>
                    </td>

                    {/* Nama Customer & Phone */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {sheep.customer_name}
                      </div>
                      {sheep.customer_phone ? (
                        <a
                          href={`https://wa.me/${sheep.customer_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-800 mt-0.5"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone className="w-3 h-3 text-amber-700" />
                          <span>{sheep.customer_phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>

                    {/* Ras & Gender */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="text-xs sm:text-sm text-slate-800 font-medium">
                        {sheep.breed}
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            sheep.gender === 'Jantan'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          <span>{sheep.gender === 'Jantan' ? '♂' : '♀'}</span>
                          <span>{sheep.gender}</span>
                        </span>
                      </div>
                    </td>

                    {/* BB Awal */}
                    <td className="py-4 px-4 sm:px-6 text-right font-mono text-xs sm:text-sm text-slate-600">
                      {formatWeight(sheep.initial_weight)}
                    </td>

                    {/* BB Akhir */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="font-mono font-bold text-xs sm:text-sm text-amber-900">
                        {formatWeight(sheep.final_weight)}
                      </div>
                      {weightGain > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#5C6F57]">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span>+{weightGain.toFixed(1)} kg</span>
                        </span>
                      ) : weightGain < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600">
                          <span>{weightGain.toFixed(1)} kg</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">stabil</span>
                      )}
                    </td>

                    {/* Tanggal Terjual */}
                    <td className="py-4 px-4 sm:px-6 text-center font-mono text-xs text-slate-600">
                      {formatDate(sheep.sold_date)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Terjual
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/track/${sheep.tracking_code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 transition-colors shadow-2xs"
                          title="Buka riwayat log perkembangan domba yang telah selesai/terjual"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                          <span>Detail Riwayat</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer Summary */}
      <div className="p-4 bg-[#EBF2E8]/40 border-t border-[#B1C5AA]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          {activeTab === 'active' ? (
            <>
              Menampilkan <span className="font-semibold text-slate-700">{filteredActiveSheep.length}</span> domba aktif pada tab ini (dari total{' '}
              <span className="font-semibold text-slate-700">{activeSheepList.length}</span> domba penitipan).
            </>
          ) : (
            <>
              Menampilkan <span className="font-semibold text-slate-700">{filteredSoldSheep.length}</span> riwayat domba pada tab ini (dari total{' '}
              <span className="font-semibold text-slate-700">{soldSheep.length}</span> domba terjual).
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>* Klik kode tracking atau tombol &lsquo;Detail Riwayat&rsquo; untuk melihat histori perkembangan lengkap</span>
        </div>
      </div>
    </div>
  )
}

