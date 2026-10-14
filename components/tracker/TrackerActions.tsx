'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'

interface TrackerActionsProps {
  trackingCode: string
  customerName: string
}

export function TrackerActions({
  trackingCode,
  customerName,
}: TrackerActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  const adminWhatsAppNumber = '6281234567890'
  const waMessage = encodeURIComponent(
    `Halo Admin Kandang Kang Iky, saya ${customerName}. Ingin konsultasi & update mengenai domba titipan saya dengan kode tracking *${trackingCode}*. Terima kasih.`
  )
  const waUrl = `https://wa.me/${adminWhatsAppNumber}?text=${waMessage}`

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-[0.99]"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-[#5C6F57]" />
            <span className="text-[#5C6F57] font-bold">Link Berhasil Disalin!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-500" />
            <span>Salin Link Bagikan</span>
          </>
        )}
      </button>

      {/* Chat Admin WhatsApp Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#89A482] hover:bg-[#789371] active:scale-[0.99] text-white text-sm font-semibold shadow-xs transition-all text-center"
      >
        <MessageCircle className="w-4 h-4 text-white/80" />
        <span>Chat Admin WhatsApp</span>
      </a>
    </div>
  )
}
