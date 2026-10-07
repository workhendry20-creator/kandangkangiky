'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Activity,
  ArrowRight,
  TrendingUp,
  HeartPulse,
  Sparkles,
  Lock,
} from 'lucide-react'

export default function HomePage() {
  const [trackingCode, setTrackingCode] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingCode.trim()) {
      router.push(`/track/${trackingCode.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-slate-800">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold shadow-md shadow-emerald-800/20">
              <span className="text-xl">🐑</span>
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Kandang Kang Iky
              </span>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Peternakan & Layanan Titip Domba Qurban
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparan, Terukur & Terawat Hingga Iduladha</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Pantau Perkembangan Domba Titipan Anda Secara{' '}
            <span className="text-emerald-800 underline decoration-emerald-300 decoration-wavy decoration-2">
              Real-Time
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Sistem pemantauan bobot, catatan pakan harian, dan rekam medis domba dengan akses langsung tanpa login untuk kenyamanan shohibul qurban.
          </p>

          {/* Central Search Card */}
          <div className="pt-4 max-w-xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="p-2 sm:p-2.5 rounded-2xl bg-white border border-stone-200/90 shadow-xl shadow-stone-200/50 flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Masukkan Kode ID Domba (Contoh: KKY-8F3A2)"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-md shadow-emerald-800/20 transition-all cursor-pointer shrink-0"
              >
                <span>Lacak Domba</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Atau coba contoh kode:{' '}
              <button
                type="button"
                onClick={() => setTrackingCode('KKY-8F3A2')}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                KKY-8F3A2
              </button>
            </p>
          </div>

          {/* 3 Value Highlights */}
          <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Grafik Bobot Akurat
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Timbangan digital berkala untuk memantau target kenaikan bobot hingga Iduladha.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Rekam Medis & Pakan
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vaksinasi berkala, pakan bernutrisi tinggi, dan observasi kesehatan harian.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Dokumentasi Visual
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Galeri foto dan video perkembangan domba langsung dari kandang Parung Bogor.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2026 Kandang Kang Iky. Hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/admin/login" className="hover:text-emerald-800">
              Admin Console
            </Link>
            <span>•</span>
            <span>Parung, Bogor, Jawa Barat</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
