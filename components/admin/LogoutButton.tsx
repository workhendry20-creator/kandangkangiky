'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
  variant?: 'outline' | 'ghost'
}

export function LogoutButton({ className = '', variant = 'outline' }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/admin/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const baseStyles =
    variant === 'outline'
      ? 'border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700 shadow-sm'
      : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/80'

  return (
    <button
      type="button"
      id="btnLogout"
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${baseStyles} ${className}`}
      title="Keluar dari sesi Admin"
    >
      <LogOut className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      <span>{loading ? 'Keluar...' : 'Logout'}</span>
    </button>
  )
}
