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

export interface RealtimeAgeResult {
  formattedDate: string
  totalDays: number
  months: number
  remainingDays: number
  ageInDaysText: string
  ageInMonthsText: string
}

/**
 * Calculate realtime age from arrival_date to current date
 */
export function calculateRealtimeAge(
  dateInput: string | Date | null | undefined
): RealtimeAgeResult {
  if (!dateInput) {
    return {
      formattedDate: '-',
      totalDays: 0,
      months: 0,
      remainingDays: 0,
      ageInDaysText: '0 Hari',
      ageInMonthsText: '0 Bulan 0 Hari',
    }
  }

  const arrivalDate = new Date(dateInput)
  if (isNaN(arrivalDate.getTime())) {
    return {
      formattedDate: '-',
      totalDays: 0,
      months: 0,
      remainingDays: 0,
      ageInDaysText: '0 Hari',
      ageInMonthsText: '0 Bulan 0 Hari',
    }
  }

  const today = new Date()

  // Reset to midnight to calculate calendar days accurately
  const start = new Date(
    arrivalDate.getFullYear(),
    arrivalDate.getMonth(),
    arrivalDate.getDate()
  )
  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const diffMs = current.getTime() - start.getTime()
  const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  // Calculate cumulative months & remaining days
  let months =
    (current.getFullYear() - start.getFullYear()) * 12 +
    (current.getMonth() - start.getMonth())
  let anchor = new Date(
    start.getFullYear(),
    start.getMonth() + months,
    start.getDate()
  )

  if (anchor > current) {
    months--
    anchor = new Date(
      start.getFullYear(),
      start.getMonth() + months,
      start.getDate()
    )
  }

  const remainingDiffMs = current.getTime() - anchor.getTime()
  const remainingDays = Math.max(
    0,
    Math.floor(remainingDiffMs / (1000 * 60 * 60 * 24))
  )

  // Format: DD MMMM YYYY
  let formattedDate = '-'
  try {
    formattedDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(arrivalDate)
  } catch {
    formattedDate = String(dateInput)
  }

  return {
    formattedDate,
    totalDays,
    months,
    remainingDays,
    ageInDaysText: `${totalDays} Hari`,
    ageInMonthsText: `${months} Bulan ${remainingDays} Hari`,
  }
}
