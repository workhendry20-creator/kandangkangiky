'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { fullSyncToSheets } from '@/lib/actions/farm-sheep'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface SyncSheetsButtonProps {
  className?: string
  size?: 'sm' | 'md'
}

export function SyncSheetsButton({ className = '', size = 'md' }: SyncSheetsButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSync = () => {
    if (isPending) return

    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fullSyncToSheets()
        if (res.success) {
          setFeedback({
            type: 'success',
            message: res.message || 'Full sync ke Google Sheets berhasil!',
          })
          router.refresh()
        } else {
          setFeedback({
            type: 'error',
            message: res.message || res.error || 'Gagal melakukan sync ke Google Sheets.',
          })
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.'
        setFeedback({ type: 'error', message: msg })
      }

      // Auto-clear feedback after 5 seconds
      setTimeout(() => {
        setFeedback(null)
      }, 5000)
    })
  }

  const isSmall = size === 'sm'

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        title="Bersihkan & Sinkronisasi ulang data domba kandang ke Google Sheets"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-[#B1C5AA] bg-[#EBF2E8] hover:bg-[#D9E5D6] text-[#5C6F57] font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isSmall ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-xs sm:text-sm'
          } ${className}`}
      >
        <RefreshCw
          className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#5C6F57] ${isPending ? 'animate-spin' : ''
            }`}
        />
        <span>{isPending ? 'Menyinkronkan...' : 'Sync Sheets'}</span>
      </button>

      {/* Floating feedback toast */}
      {feedback && (
        <div
          className={`absolute left-0 sm:left-auto right-auto sm:right-0 top-full mt-2 z-50 whitespace-normal sm:whitespace-nowrap max-w-[280px] sm:max-w-none rounded-xl px-3.5 py-2 text-xs font-semibold shadow-lg border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${feedback.type === 'success'
              ? 'bg-[#5C6F57] text-white border-[#4d5e49]'
              : 'bg-rose-900 text-white border-rose-700'
            }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#B1C5AA] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  )
}
