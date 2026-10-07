import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique tracking code with format KKY-XXXXX
 * Uses unambiguous characters (excluding 0, O, 1, I)
 */
export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `KKY-${code}`
}

/**
 * Format weight in kilograms
 */
export function formatWeight(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.0 kg'
  return `${Number(val).toFixed(1)} kg`
}

/**
 * Format Indonesian date
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}
