import crypto from 'crypto'
import { cookies } from 'next/headers'

export interface AdminUserSession {
  id: string
  username: string
  name: string
  role?: string
  exp?: number
}

const AUTH_COOKIE_NAME = 'admin_session'
const SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'kandang-kang-iky-admin-secret-2026'

/**
 * Sign an admin session payload into a secure HMAC-SHA256 token
 */
export function createSessionToken(payload: Omit<AdminUserSession, 'exp'>): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days expiration
  const data: AdminUserSession = { ...payload, exp }
  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encodedData)
    .digest('base64url')

  return `${encodedData}.${signature}`
}

/**
 * Verify and decode an admin session token
 */
export function verifySessionToken(token: string): AdminUserSession | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null
  }

  try {
    const [encodedData, signature] = token.split('.')
    if (!encodedData || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(encodedData)
      .digest('base64url')

    if (signature !== expectedSignature) {
      return null
    }

    const payload = JSON.parse(
      Buffer.from(encodedData, 'base64url').toString('utf-8')
    ) as AdminUserSession

    if (!payload.exp || payload.exp < Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Get current admin session from server cookies
 */
export async function getAdminSession(): Promise<AdminUserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    if (!token) return null
    return verifySessionToken(token)
  } catch {
    return null
  }
}

/**
 * Set admin session cookie in server context
 */
export async function setAdminSessionCookie(session: Omit<AdminUserSession, 'exp'>): Promise<void> {
  const token = createSessionToken(session)
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === 'production'

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Remove admin session cookie in server context
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

/**
 * Check if request has a valid admin session (either via custom admin_session cookie or Supabase auth)
 */
export async function requireAdminSession(): Promise<AdminUserSession | null> {
  const session = await getAdminSession()
  if (session) return session

  // Fallback to Supabase auth
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      return {
        id: data.user.id,
        username: data.user.email?.split('@')[0] || 'admin',
        name: data.user.email || 'Admin',
      }
    }
  } catch {
    // Ignore
  }

  return null
}

