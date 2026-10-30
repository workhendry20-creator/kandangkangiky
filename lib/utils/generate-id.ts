/**
 * Utility functions for generating and validating universal sequential Sheep IDs (KKY-XXXX)
 */

/**
 * Extract numeric sequence from a tracking code with format KKY-XXXX (e.g. KKY-0012 -> 12, KKY-1 -> 1)
 */
export function extractTrackingNumber(code: string | null | undefined): number | null {
  if (!code) return null
  const clean = String(code).trim().toUpperCase().replace(/^#/, '')
  const match = clean.match(/^KKY[-_ ]?(\d+)$/)
  if (match) {
    const num = parseInt(match[1], 10)
    return isNaN(num) ? null : num
  }
  return null
}

/**
 * Format a number to standard 4-digit zero-padded KKY-XXXX (e.g. 1 -> KKY-0001, 9 -> KKY-0009, 13 -> KKY-0013)
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
 * Validates if a code matches the standard universal format (KKY-XXXX with 4 digits)
 */
export function isValidTrackingCode(code: string): boolean {
  if (!code) return false
  const clean = String(code).trim().toUpperCase().replace(/^#/, '')
  return /^KKY-\d{4,}$/.test(clean)
}

/**
 * Client-side helper to fetch the next sequential code via API route
 */
export async function fetchNextTrackingCode(): Promise<string> {
  try {
    const res = await fetch('/api/sheep', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.next_tracking_code || data.recommended_id || 'KKY-0001'
  } catch (err) {
    console.warn('[generate-id] Error fetching next tracking code via API:', err)
    return 'KKY-0001'
  }
}

/**
 * Client-side helper to check if a tracking code is available via API route
 */
export async function checkTrackingCodeApi(
  code: string
): Promise<{ available: boolean; message?: string }> {
  try {
    const clean = encodeURIComponent(code.trim().toUpperCase())
    const res = await fetch(`/api/sheep?check=${clean}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('[generate-id] Error checking code availability via API:', err)
    return { available: true }
  }
}
