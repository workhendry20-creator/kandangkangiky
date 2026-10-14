'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { syncAllProgressLogsToSheets } from '@/lib/actions/progress'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface SyncLogTitipanButtonProps {
  className?: string
  size?: 'sm' | 'md'
  iconOnly?: boolean
}

export function SyncLogTitipanButton({
  className = '',
  size = 'sm',
  iconOnly = true,
}: SyncLogTitipanButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleSync = () => {
    if (isPending) return

    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await syncAllProgressLogsToSheets()
        if (res.success) {
          setFeedback({
            type: 'success',
            message: res.message || 'Sync log progress titipan ke Google Sheets berhasil!',
          })
          router.refresh()
        } else {
          setFeedback({
            type: 'error',
            message:
              res.message || res.error || 'Gagal melakukan sync log ke Google Sheets.',
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
        id="btnSyncLogTitipan"
        onClick={handleSync}
        disabled={isPending}
        aria-label="Sinkronisasi seluruh log progress ke Google Sheets"
        title={
          isPending
            ? 'Sedang menyinkronkan seluruh log progress...'
            : 'Sinkronkan seluruh data log perkembangan ke Google Sheets (Log_Titipan)'
        }
        className={`inline-flex items-center justify-center rounded-xl border border-[#B1C5AA] bg-[#EBF2E8] hover:bg-[#D9E5D6] active:scale-[0.98] text-[#5C6F57] font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          iconOnly
            ? isSmall
              ? 'w-9 h-9 p-2'
              : 'w-10 h-10 p-2.5'
            : isSmall
            ? 'px-3 py-2 text-xs gap-1.5'
            : 'px-3.5 py-2.5 text-xs sm:text-sm gap-1.5'
        } ${className}`}
      >
        <RefreshCw
          className={`${isSmall ? 'w-4 h-4' : 'w-4.5 h-4.5'} text-[#5C6F57] ${
            isPending ? 'animate-spin' : ''
          }`}
        />
        {!iconOnly && (
          <span>{isPending ? 'Menyinkronkan...' : 'Sync Log'}</span>
        )}
      </button>

      {/* Floating feedback toast */}
      {feedback && (
        <div
          className={`absolute left-0 sm:left-auto right-auto sm:right-0 top-full mt-2 z-50 whitespace-normal sm:whitespace-nowrap max-w-[280px] sm:max-w-none rounded-xl px-3.5 py-2 text-xs font-semibold shadow-lg border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
            feedback.type === 'success'
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
