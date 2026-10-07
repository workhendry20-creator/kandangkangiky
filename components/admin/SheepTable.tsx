'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatWeight, formatDate } from '@/lib/utils'
import type { Sheep } from '@/types/sheep'
import {
  Search,
  Filter,
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
}

export function SheepTable({ initialSheep }: SheepTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Penitipan' | 'Selesai/Terkirim' | 'Terjual'>('ALL')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode(null)
    }, 1500)
  }

  // Filter sheep list based on search query (tracking_code / customer_name) and status
  const filteredSheep = useMemo(() => {
    return initialSheep.filter((item) => {
      const q = searchQuery.trim().toLowerCase()
      const matchSearch =
        !q ||
        item.tracking_code.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q)

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [initialSheep, searchQuery, statusFilter])

  return (
    <div className="rounded-3xl bg-white border border-stone-200/90 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-stone-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Master Data Domba Titipan
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {filteredSheep.length} Ekor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar ternak mitra dalam masa penggemukan dan perawatan Iduladha.
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
              className="w-full sm:w-72 pl-9 pr-8 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-xs transition-all"
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

          {/* Status Filter Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-slate-700 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                id="statusFilterSelect"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as 'ALL' | 'Penitipan' | 'Selesai/Terkirim' | 'Terjual'
                  )
                }
                className="bg-transparent focus:outline-none text-xs font-semibold text-slate-700 cursor-pointer pr-1"
              >
                <option value="ALL">Semua Status</option>
                <option value="Penitipan">Penitipan</option>
                <option value="Selesai/Terkirim">Selesai/Terkirim</option>
                <option value="Terjual">Terjual</option>
              </select>
            </div>
          </div>

          {/* Add New Sheep Button */}
          <Link
            href="/admin/sheep/new"
            id="btnAddNewSheepTop"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Domba</span>
          </Link>
        </div>
      </div>

      {/* Table Data or Empty State */}
      {initialSheep.length === 0 ? (
        /* Empty Database State */
        <div className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 text-3xl flex items-center justify-center mx-auto border border-emerald-100">
            🐑
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Belum Ada Domba Terdaftar
            </h3>
            <p className="text-xs text-slate-500">
              Database kandang masih kosong. Daftarkan domba titipan pertama Anda untuk mulai mencatat pertumbuhan berat badan.
            </p>
          </div>
          <Link
            href="/admin/sheep/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-md shadow-emerald-800/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Daftarkan Domba Pertama</span>
          </Link>
        </div>
      ) : filteredSheep.length === 0 ? (
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
              Pencarian untuk &ldquo;{searchQuery}&rdquo; tidak menemukan hasil.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('ALL')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF7F2] text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-stone-200">
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
              {filteredSheep.map((sheep) => {
                // Calculate current weight
                const currentWeight = sheep.current_weight ?? sheep.initial_weight
                const weightGain = currentWeight - sheep.initial_weight

                return (
                  <tr
                    key={sheep.id}
                    className="hover:bg-stone-50/70 transition-colors group"
                  >
                    {/* Tracking Code */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/track/${sheep.tracking_code}`}
                          className="font-mono font-bold text-emerald-800 hover:underline hover:text-emerald-900 text-xs sm:text-sm tracking-wide"
                          title="Lihat portal lacak publik"
                        >
                          {sheep.tracking_code}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(sheep.tracking_code)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
                          title="Salin kode tracking"
                        >
                          {copiedCode === sheep.tracking_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 mt-0.5"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
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
                      <div className="font-mono font-bold text-xs sm:text-sm text-emerald-800">
                        {formatWeight(currentWeight)}
                      </div>
                      {weightGain > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span>+{weightGain.toFixed(1)} kg</span>
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
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          sheep.status === 'Penitipan'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : sheep.status === 'Selesai/Terkirim'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {sheep.status}
                      </span>
                    </td>

                    {/* Aksi (+ Log Progress & Detail) */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* + Log Progress Button */}
                        <Link
                          href={`/admin/sheep/${sheep.id}/progress`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
                          title="Input log progress berkala (TASK 3)"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">+ Log Progress</span>
                          <span className="sm:hidden">+ Log</span>
                        </Link>

                        {/* Detail / Public Link Button */}
                        <Link
                          href={`/track/${sheep.tracking_code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-slate-600 text-xs font-medium transition-colors"
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
      )}

      {/* Table Footer Summary */}
      <div className="p-4 bg-[#FAF7F2] border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-semibold text-slate-700">{filteredSheep.length}</span> dari{' '}
          <span className="font-semibold text-slate-700">{initialSheep.length}</span> domba terdaftar.
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>* Klik kode tracking atau &lsquo;Detail&rsquo; untuk melihat kartu lacak publik</span>
        </div>
      </div>
    </div>
  )
}
