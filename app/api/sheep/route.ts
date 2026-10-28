import { NextResponse } from 'next/server'
import { getNextTrackingCode, createSheep } from '@/lib/actions/sheep'

/**
 * GET /api/sheep
 * Returns the next sequential tracking code formatted as KKY-XXXX (e.g. KKY-0001)
 */
export async function GET() {
  try {
    const nextTrackingCode = await getNextTrackingCode()
    return NextResponse.json({
      success: true,
      next_tracking_code: nextTrackingCode,
    })
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Gagal menghasilkan tracking code'
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
