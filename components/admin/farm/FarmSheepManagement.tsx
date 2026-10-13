'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FarmSheep, FarmEvent } from '@/types/farm-sheep'
import { FarmSheepTable } from './FarmSheepTable'
import { BirthEventsTable } from './BirthEventsTable'
import { TreatmentEventsTable } from './TreatmentEventsTable'
import { NewFarmSheepModal } from './NewFarmSheepModal'
import { EditFarmSheepModal } from './EditFarmSheepModal'
import { ImportCsvModal } from './ImportCsvModal'
import { NewBirthModal } from './NewBirthModal'
import { NewTreatmentModal } from './NewTreatmentModal'
import {
  Warehouse,
  Baby,
  HeartPulse,
  Sparkles,
  TrendingUp,
  Activity,
} from 'lucide-react'

interface FarmSheepManagementProps {
  initialSheep: FarmSheep[]
  initialEvents: FarmEvent[]
}

export function FarmSheepManagement({
  initialSheep,
  initialEvents,
}: FarmSheepManagementProps) {
  const router = useRouter()

  // Active sub-tab: 'master' | 'birth' | 'treatment'
  const [activeTab, setActiveTab] = useState<'master' | 'birth' | 'treatment'>('master')

  // Modals state
  const [isNewSheepModalOpen, setIsNewSheepModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSheepForEdit, setSelectedSheepForEdit] = useState<FarmSheep | null>(null)
  const [isNewBirthModalOpen, setIsNewBirthModalOpen] = useState(false)
  const [isNewTreatmentModalOpen, setIsNewTreatmentModalOpen] = useState(false)

  const handleRefresh = () => {
    router.refresh()
  }

  const handleOpenEdit = (sheep: FarmSheep) => {
    setSelectedSheepForEdit(sheep)
    setIsEditModalOpen(true)
  }

  // Calculate Metrics
  const totalSheep = initialSheep.length
  const indukanList = initialSheep.filter(
    (s) => s.gender === 'Betina' || s.sheep_type === 'Indukan'
  )
  const indukanCount = indukanList.length
  const hamilCount = initialSheep.filter((s) => s.status === 'Hamil').length
  const menyusuiCount = initialSheep.filter(
    (s) => s.status === 'Menyusui' || s.status === 'Kosongan/Menyusui'
  ).length
  const pejantanCount = initialSheep.filter(
    (s) => s.gender === 'Jantan' || s.sheep_type === 'Pejantan'
  ).length

  const birthEvents = initialEvents.filter((e) => e.event_type === 'Kelahiran')
  const treatmentEvents = initialEvents.filter((e) => e.event_type === 'Tindakan')
  const totalLambs = birthEvents.reduce((acc, e) => acc + (e.lamb_count || 1), 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-xs">
        <div className="absolute -right-10 -top-10 w-52 h-52 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pusat Inventaris & Breeding Internal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Ternak Kandang Kang Iky
          </h1>
          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Kelola master data domba internal (Indukan, Pejantan/Pemacek), catat kelahiran cempe, dan monitoring rekam medis berkala.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Domba Kandang */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Domba Kandang
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Warehouse className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900">{totalSheep}</span>
              <span className="text-sm text-slate-500">ekor</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Populasi Internal Aktif</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
            <span>{indukanCount} Indukan</span>
            <span>•</span>
            <span>{pejantanCount} Pejantan</span>
          </div>
        </div>

        {/* Card 2: Indukan Produktif */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Indukan Produktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center font-bold">
              ♀
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-pink-700">{indukanCount}</span>
              <span className="text-sm text-slate-500">ekor</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-pink-800 font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>{hamilCount} Hamil • {menyusuiCount} Menyusui</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
            <span>Breeding Target 2026</span>
            <span className="text-pink-700 font-medium">Parung, Bogor</span>
          </div>
        </div>

        {/* Card 3: Pejantan / Pemacek */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pejantan / Pemacek
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              ♂
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-blue-800">{pejantanCount}</span>
              <span className="text-sm text-slate-500">ekor</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pejantan Unggul Terseleksi</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
            <span>Garut Adu, Dorper & Texel</span>
            <span className="text-blue-700 font-medium">Siap Kawin</span>
          </div>
        </div>

        {/* Card 4: Total Kelahiran Cempe */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Kelahiran
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Baby className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-amber-800">{totalLambs}</span>
              <span className="text-sm text-slate-500">ekor anak</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{birthEvents.length} kali persalinan</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between text-[11px] text-slate-500">
            <span>Rekam Breeding Kandang</span>
            <span className="text-emerald-700 font-medium">Aktif</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-200/60 rounded-2xl w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('master')}
          id="tabMasterKandang"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'master'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Warehouse className="w-4 h-4 text-emerald-700" />
          <span>Tab 1: Master Domba Kandang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('birth')}
          id="tabCatatanKelahiran"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'birth'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Baby className="w-4 h-4 text-pink-600" />
          <span>Tab 2: Catatan Kelahiran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('treatment')}
          id="tabRekamTindakan"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'treatment'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-blue-600" />
          <span>Tab 3: Rekam Medis & Tindakan</span>
        </button>
      </div>

      {/* Sub-Tab Contents */}
      {activeTab === 'master' && (
        <FarmSheepTable
          sheepList={initialSheep}
          onOpenNewModal={() => setIsNewSheepModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenEditModal={handleOpenEdit}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'birth' && (
        <BirthEventsTable
          events={initialEvents}
          onOpenNewBirthModal={() => setIsNewBirthModalOpen(true)}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'treatment' && (
        <TreatmentEventsTable
          events={initialEvents}
          onOpenNewTreatmentModal={() => setIsNewTreatmentModalOpen(true)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modals */}
      <NewFarmSheepModal
        isOpen={isNewSheepModalOpen}
        onClose={() => setIsNewSheepModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <EditFarmSheepModal
        sheep={selectedSheepForEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedSheepForEdit(null)
        }}
        onSuccess={handleRefresh}
      />

      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <NewBirthModal
        sheepList={initialSheep}
        isOpen={isNewBirthModalOpen}
        onClose={() => setIsNewBirthModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <NewTreatmentModal
        sheepList={initialSheep}
        isOpen={isNewTreatmentModalOpen}
        onClose={() => setIsNewTreatmentModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
