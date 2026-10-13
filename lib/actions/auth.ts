'use server'

import { createAdminClient } from '@/lib/supabase/server'
import {
  setAdminSessionCookie,
  clearAdminSessionCookie,
  getAdminSession,
  type AdminUserSession,
} from '@/lib/auth'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'

export interface LoginResult {
  success: boolean
  message?: string
  error?: string
  user?: AdminUserSession
}

/**
 * Verify admin credentials against `admin_users` table in Supabase
 * and set secure admin_session cookie upon success.
 */
export async function loginAdminAction(
  usernameOrFormData: string | FormData,
  passwordInput?: string
): Promise<LoginResult> {
  let username = ''
  let password = ''

  if (typeof usernameOrFormData === 'object' && usernameOrFormData !== null && 'get' in usernameOrFormData) {
    username = String(usernameOrFormData.get('username') || usernameOrFormData.get('email') || '').trim()
    password = String(usernameOrFormData.get('password') || '').trim()
  } else {
    username = String(usernameOrFormData || '').trim()
    password = String(passwordInput || '').trim()
  }

  if (!username || !password) {
    return {
      success: false,
      error: 'Username dan kata sandi wajib diisi.',
    }
  }

  try {
    const supabaseAdmin = createAdminClient()

    // 1. Fetch user by username from admin_users table
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .ilike('username', username)
      .maybeSingle()

    if (error || !user) {
      return {
        success: false,
        error: 'Username atau kata sandi salah',
      }
    }

    // 2. Check password match (plain text or sha256)
    const storedPassword = String(user.password_hash || user.password || '')
    let isMatch = storedPassword === password

    if (!isMatch && storedPassword) {
      const sha256 = crypto.createHash('sha256').update(password).digest('hex')
      if (storedPassword === sha256) {
        isMatch = true
      }
    }

    if (!isMatch) {
      return {
        success: false,
        error: 'Username atau kata sandi salah',
      }
    }

    // 3. Set secure auth cookie session for admin
    const sessionPayload: AdminUserSession = {
      id: String(user.id),
      username: String(user.username),
      name: String(user.name || user.username),
      role: 'admin',
    }

    await setAdminSessionCookie(sessionPayload)
    revalidatePath('/admin', 'layout')

    return {
      success: true,
      message: 'Login berhasil! Mengalihkan ke dashboard...',
      user: sessionPayload,
    }
  } catch (err: unknown) {
    console.error('[loginAdminAction error]:', err)
    return {
      success: false,
      error: 'Terjadi kendala server saat memverifikasi login.',
    }
  }
}

/**
 * Logout admin action - clears admin session cookie
 */
export async function logoutAdminAction(): Promise<{ success: boolean }> {
  try {
    await clearAdminSessionCookie()
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch {
    return { success: false }
  }
}

/**
 * Retrieve current active admin session
 */
export async function getCurrentAdmin(): Promise<AdminUserSession | null> {
  return getAdminSession()
}
