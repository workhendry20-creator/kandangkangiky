'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom')
  const errorParam = searchParams.get('error')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setErrorMessage('Harap masukkan email dan kata sandi.')
      return
    }

    try {
      setLoading(true)
      setErrorMessage(null)

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid credentials')
        ) {
          setErrorMessage('Email atau password salah. Silakan periksa kembali.')
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMessage('Email akun Anda belum dikonfirmasi.')
        } else {
          setErrorMessage(error.message)
        }
        setLoading(false)
        return
      }

      // Login berhasil: redirect ke dashboard atau rute asal
      const targetUrl = redirectedFrom || '/admin/dashboard'
      router.push(targetUrl)
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghubungkan ke server.'
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
            Masuk dengan akun pengelola untuk mengelola ternak dan pemantauan titip qurban.
          </p>
        </div>

        {/* Error Alert */}
        {(errorMessage || errorParam) && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-900">Gagal Masuk</p>
              <p className="text-xs text-rose-700">
                {errorMessage ||
                  (errorParam === 'auth_failed'
                    ? 'Sesi tidak valid atau telah berakhir. Silakan masuk kembali.'
                    : 'Terjadi kendala autentikasi. Silakan periksa kredensial Anda.')}
              </p>
            </div>
          </div>
        )}

        {/* Form Login Email & Password */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="emailInput"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Email Admin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="emailInput"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kandangkangiky.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="passwordInput"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="passwordInput"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btnLoginSubmit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-emerald-800/20 transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer mt-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                <span>Memverifikasi akun...</span>
              </div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk sebagai Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Autentikasi terenkripsi via Supabase Auth</span>
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
