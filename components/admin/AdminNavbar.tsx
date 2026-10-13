'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from './LogoutButton'
import {
  ShieldCheck,
  TrendingUp,
  Warehouse,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'

export function AdminNavbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('admin@kandangkangiky.com')
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Close mobile menu on route change without useEffect cascading render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileMenuOpen(false)
  }

  // Fetch current authenticated user email on client
  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email)
        }
      })
    } catch {
      // Ignore if supabase client unconfigured
    }
  }, [])

  // Don't render admin navbar on login page
  if (pathname.startsWith('/admin/login')) {
    return null
  }

  const userInitials = userEmail.slice(0, 2).toUpperCase()

  const isTitipanActive =
    pathname === '/admin/dashboard' || pathname.startsWith('/admin/sheep')
  const isFarmSheepActive = pathname.startsWith('/admin/farm-sheep')

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between gap-4">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold shadow-md shadow-emerald-800/20 group-hover:scale-105 transition-transform">
                <span className="text-xl">🐑</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Admin Console
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-stone-200">
              <Link
                href="/admin/dashboard"
                id="navLinkTitipanQurban"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isTitipanActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Titipan & Qurban</span>
              </Link>

              <Link
                href="/admin/farm-sheep"
                id="navLinkFarmSheep"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isFarmSheepActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span>Inventaris Kandang</span>
              </Link>
            </nav>
          </div>

          {/* Right Controls & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status Online Pulsing Green Dot */}
            <div
              className="flex items-center justify-center p-2 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-2xs"
              title="Sistem Online & Sync Aktif"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
            </div>

            {/* Link to Public Portal */}
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors"
              title="Buka Website Publik"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Portal Publik</span>
            </Link>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-stone-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center ring-2 ring-emerald-100 shadow-xs">
                {userInitials}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span
                  className="text-xs font-semibold text-slate-900 max-w-[140px] truncate"
                  title={userEmail}
                >
                  {userEmail}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Owner / Peternak
                </span>
              </div>

              {/* Logout Button */}
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              id="btnMobileMenuToggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-stone-100 focus:outline-none transition-colors"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col gap-1.5">
              <Link
                href="/admin/dashboard"
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isTitipanActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Titipan & Qurban</span>
                </div>
                <span className="text-xs opacity-75">/dashboard</span>
              </Link>

              <Link
                href="/admin/farm-sheep"
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isFarmSheepActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Warehouse className="w-4 h-4" />
                  <span>Inventaris Kandang</span>
                </div>
              </Link>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Portal Publik</span>
              </Link>

              <div className="flex items-center gap-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
