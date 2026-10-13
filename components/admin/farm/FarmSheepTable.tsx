'use client'

import React, { useState, useTransition } from 'react'
import { deleteFarmSheep } from '@/lib/actions/farm-sheep'
import type { FarmSheep } from '@/types/farm-sheep'
import {
  Search,
  Plus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { SyncSheetsButton } from './SyncSheetsButton'

interface FarmSheepTableProps {
  sheepList: FarmSheep[]
  onOpenNewModal: () => void
  onOpenImportModal: () => void
  onOpenEditModal: (sheep: FarmSheep) => void
  onRefresh: () => void
}

export function FarmSheepTable({
  sheepList,
  onOpenNewModal,
  onOpenImportModal,
  onOpenEditModal,
  onRefresh,
}: FarmSheepTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [, startTransition] = useTransition()

  // Filter logic
  const filteredSheep = sheepList.filter((s) => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      s.tag_code.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.breed.toLowerCase().includes(query) ||
      (s.notes && s.notes.toLowerCase().includes(query))

    const matchesType =
      filterType === 'all' || s.sheep_type === filterType

    const matchesStatus =
      filterStatus === 'all' || s.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus domba kandang "${name}"? Seluruh rekam medis dan kelahirannya juga akan terhapus.`)) {
      setIsDeletingId(id)
      setToast(null)
      startTransition(async () => {
        const res = await deleteFarmSheep(id)
        setIsDeletingId(null)
        if (res.success) {
          setToast({
            type: 'success',
            message: res.message || `Domba "${name}" berhasil dihapus dan disinkronkan ke Google Sheets!`,
          })
          onRefresh()
          setTimeout(() => setToast(null), 5000)
        } else {
          setToast({
            type: 'error',
            message: res.error || 'Gagal menghapus domba.',
          })
          setTimeout(() => setToast(null), 5000)
        }
      })
    }
  }

  // Format Status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hamil':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Menyusui':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'Kosongan/Menyusui':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Kosongan':
        return 'bg-stone-100 text-stone-700 border-stone-200'
      case 'Pemacek':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Siap Kawin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Afkir':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      default:
        return 'bg-stone-100 text-slate-700 border-stone-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Filters & Action Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID domba, nama, atau jenis ras..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-xs"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Filter Tipe */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 shadow-xs"
          >
            <option value="all">Semua Tipe</option>
            <option value="Indukan">Indukan</option>
            <option value="Pejantan">Pejantan</option>
            <option value="Anakan">Anakan</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 shadow-xs"
          >
            <option value="all">Semua Status</option>
            <option value="Hamil">Hamil</option>
            <option value="Kosongan">Kosongan</option>
            <option value="Menyusui">Menyusui</option>
            <option value="Kosongan/Menyusui">Kosongan/Menyusui</option>
            <option value="Pemacek">Pemacek</option>
            <option value="Siap Kawin">Siap Kawin</option>
          </select>

          {/* Sync & Import Actions */}
          <SyncSheetsButton size="sm" />
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Import CSV</span>
          </button>

          {/* Add New Button */}
          <button
            type="button"
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Domba</span>
          </button>
        </div>
      </div>

      {/* Toast Alert Feedback */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">ID & Nama</th>
                <th className="py-3.5 px-4">Gender & Tipe</th>
                <th className="py-3.5 px-4">Jenis / Ras</th>
                <th className="py-3.5 px-4">Asal</th>
                <th className="py-3.5 px-4">Tgl Masuk</th>
                <th className="py-3.5 px-4">BB Awal / Saat Ini</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {filteredSheep.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-xl">
                        🐑
                      </div>
                      <p className="font-semibold text-slate-700">
                        {searchQuery ? 'Tidak ada domba yang cocok dengan pencarian.' : 'Belum ada domba di Master Kandang.'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Tambahkan domba kandang baru atau gunakan fitur Import CSV untuk mengunggah spreadsheet owner.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={onOpenNewModal}
                          className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                        >
                          + Tambah Domba
                        </button>
                        <button
                          type="button"
                          onClick={onOpenImportModal}
                          className="px-3.5 py-2 rounded-xl border border-stone-300 text-slate-700 text-xs font-semibold hover:bg-stone-50"
                        >
                          Import CSV
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSheep.map((sheep) => (
                  <tr
                    key={sheep.id}
                    className="hover:bg-stone-50/60 transition-colors group"
                  >
                    {/* ID & Nama */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {sheep.gender === 'Betina' ? '♀' : '♂'}
                        </div>
                        <div>
                          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-stone-100 text-slate-800 border border-stone-200 inline-block">
                            {sheep.tag_code}
                          </span>
                          <p className="font-bold text-slate-900 text-sm mt-0.5">
                            {sheep.name}
                          </p>
                          {sheep.notes && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              {sheep.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Gender & Tipe */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            sheep.gender === 'Betina'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {sheep.gender}
                        </span>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {sheep.sheep_type}
                        </p>
                      </div>
                    </td>

                    {/* Jenis / Ras */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {sheep.breed}
                    </td>

                    {/* Asal */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          sheep.origin === 'Beranak'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-stone-100 text-slate-700'
                        }`}
                      >
                        {sheep.origin}
                      </span>
                    </td>

                    {/* Tgl Masuk */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {sheep.entry_date}
                    </td>

                    {/* BB Awal / Terkini */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">
                          {sheep.current_weight ?? sheep.initial_weight} kg
                        </span>
                        {sheep.current_weight && sheep.current_weight !== sheep.initial_weight && (
                          <span className="text-[11px] text-slate-400">
                            (Awal: {sheep.initial_weight}kg)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                          sheep.status
                        )}`}
                      >
                        {sheep.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isDeletingId !== null}
                          onClick={() => onOpenEditModal(sheep)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Edit domba"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingId !== null}
                          onClick={() => handleDelete(sheep.id, sheep.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Hapus domba"
                        >
                          {isDeletingId === sheep.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/40 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {filteredSheep.length} dari total {sheepList.length} domba kandang</span>
          <span>Kandang Kang Iky • Breeding & Inventaris</span>
        </div>
      </div>
    </div>
  )
}
