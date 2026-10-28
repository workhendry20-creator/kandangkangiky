import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract numeric sequence from a tracking code with format KKY-XXXX (e.g. KKY-0012 -> 12)
 */
export function extractTrackingNumber(code: string | null | undefined): number | null {
  if (!code) return null
  const clean = String(code).trim().toUpperCase().replace(/^#/, '')
  const match = clean.match(/^KKY-(\d+)$/)
  if (match) {
    const num = parseInt(match[1], 10)
    return isNaN(num) ? null : num
  }
  return null
}

/**
 * Format a number to standard 4-digit zero-padded KKY-XXXX (e.g. 1 -> KKY-0001, 13 -> KKY-0013)
 */
export function formatTrackingCode(num: number): string {
  const safeNum = Math.max(1, Math.floor(num || 1))
  return `KKY-${String(safeNum).padStart(4, '0')}`
}

/**
 * Generate a sequential tracking code format KKY-XXXX (default KKY-0001)
 */
export function generateTrackingCode(counter = 1): string {
  return formatTrackingCode(counter)
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

export interface BirthDescriptionParams {
  sireTag?: string | null
  sireName?: string | null
  lambs?: Array<{
    tag_code?: string
    name?: string
    gender?: string
    weight?: number | string | null
  }>
  userNotes?: string | null
}

/**
 * Format structured birth description with Sire and Lamb details for events and Google Sheets
 */
export function buildBirthDescription({
  sireTag,
  sireName,
  lambs,
  userNotes,
}: BirthDescriptionParams): string {
  const parts: string[] = []

  // 1. Sire info
  const tag = sireTag?.trim()
  const name = sireName?.trim()
  if (tag && name) {
    parts.push(`Bapak: [${tag}] ${name}`)
  } else if (tag) {
    parts.push(`Bapak: [${tag}]`)
  } else if (name) {
    parts.push(`Bapak: ${name}`)
  } else {
    parts.push('Bapak: -')
  }

  // 2. Lambs info
  if (lambs && lambs.length > 0) {
    const lambLines = lambs.map((lamb, idx) => {
      const lTag = lamb.tag_code?.trim() ? `[${lamb.tag_code.trim()}] ` : ''
      const lName = lamb.name?.trim() || `Cempe #${idx + 1}`
      const lGender = lamb.gender || 'Jantan'
      const lWeight =
        lamb.weight !== null &&
        lamb.weight !== undefined &&
        String(lamb.weight).trim() !== ''
          ? `${lamb.weight} kg`
          : '-'
      return `${idx + 1}. ${lTag}${lName} (${lGender}, BB: ${lWeight})`
    })
    parts.push(`Anakan (${lambs.length} Ekor):\n${lambLines.join('\n')}`)
  }

  // 3. User custom notes
  const notes = userNotes?.trim()
  if (notes) {
    parts.push(`Catatan: ${notes}`)
  }

  return parts.join('\n\n')
}
