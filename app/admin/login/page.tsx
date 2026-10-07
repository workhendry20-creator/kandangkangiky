'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, ArrowLeft, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)

      const supabase = createClient()
      const origin = window.location.origin
      const redirectTo = `${origin}/auth/callback?next=/admin/dashboard`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi server autentikasi.'
      setErrorMessage(msg)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Back to Home Button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Utama</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-stone-200/90 shadow-xl shadow-stone-200/50 p-8 sm:p-10 transition-all">
        {/* Subtle Ambient Decorative Glow */}
        <div className="absolute -right-16 -top-16 w-44 h-44 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-44 h-44 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-800/20 mb-4 ring-4 ring-emerald-50">
            <span className="text-2xl font-bold tracking-tight">🐑</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kandang Kang Iky
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Portal manajemen domba titipan, update bobot harian, dan sinkronisasi otomatis Google Sheets.
          </p>
        </div>

        {/* Error Alert */}
        {(errorMessage || errorParam) && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-900">Autentikasi Gagal</p>
              <p className="text-xs text-rose-700">
                {errorMessage ||
                  (errorParam === 'auth_failed'
                    ? 'Sesi masuk dibatalkan atau kredensial Google belum terverifikasi.'
                    : 'Terjadi kendala pada otorisasi. Silakan coba kembali.')}
              </p>
            </div>
          </div>
        )}

        {/* Login Action */}
        <div className="space-y-4">
          <button
            type="button"
            id="btnGoogleLogin"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 active:scale-[0.99] text-slate-800 font-semibold text-sm shadow-sm transition-all hover:border-emerald-700 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-slate-600">
                <svg
                  className="animate-spin h-5 w-5 text-emerald-800"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Menghubungkan ke Google...</span>
              </div>
            ) : (
              <>
                {/* Official Google Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="group-hover:text-emerald-900 transition-colors">
                  Sign in with Google
                </span>
              </>
            )}
          </button>

          {/* Features Checklist */}
          <div className="pt-4 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Akses terproteksi OAuth 2.0 Google Workspace</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Otomatisasi sinkronisasi baris Google Sheets</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kompresi foto mobile instan sebelum upload</span>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Sesi terenkripsi & dilindungi Supabase Auth</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-400">
        © 2026 Kandang Kang Iky. Hak Cipta Dilindungi.
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#FDFBF7]">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-10 bg-white rounded-3xl border border-stone-200 text-center text-sm text-slate-500">
            Memuat halaman login...
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </main>
  )
}
