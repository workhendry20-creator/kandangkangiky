import { NextResponse } from 'next/server'
import {
  getNextTrackingCode,
  checkTrackingCodeAvailability,
  createSheep,
} from '@/lib/actions/sheep'

/**
 * GET /api/sheep
 * - Jika ada query ?check=KKY-XXXX: memeriksa ketersediaan kode ID
 * - Default: Mengembalikan kode tracking sekuensial berikutnya (KKY-XXXX)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkCode = searchParams.get('check') || searchParams.get('code')

    if (checkCode) {
      const checkResult = await checkTrackingCodeAvailability(checkCode)
      return NextResponse.json(checkResult)
    }

    const nextTrackingCode = await getNextTrackingCode()
    return NextResponse.json({
      success: true,
      next_tracking_code: nextTrackingCode,
    })
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Gagal memproses request'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sheep
 * Creates a new sheep entry. If tracking_code is omitted, auto-generates the next sequential code.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createSheep(body)
    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    })
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Invalid request payload'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 400 }
    )
  }
}
