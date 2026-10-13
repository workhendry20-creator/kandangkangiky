import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // 1. Check custom admin_session cookie
  const adminCookie = request.cookies.get('admin_session')?.value
  let isAuthenticated = false

  if (adminCookie) {
    try {
      const [encodedData, signature] = adminCookie.split('.')
      if (encodedData && signature) {
        const payload = JSON.parse(
          Buffer.from(encodedData, 'base64url').toString('utf-8')
        )
        if (payload?.exp && payload.exp > Date.now()) {
          isAuthenticated = true
        }
      }
    } catch {
      isAuthenticated = false
    }
  }

  // 2. Fallback to Supabase Auth user session
  if (!isAuthenticated) {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data?.user) {
        isAuthenticated = true
      }
    } catch {
      isAuthenticated = false
    }
  }

  const pathname = request.nextUrl.pathname

  // Redirect /login alias directly
  if (pathname === '/login') {
    const targetUrl = isAuthenticated
      ? new URL('/admin/dashboard', request.url)
      : new URL('/admin/login', request.url)
    return NextResponse.redirect(targetUrl)
  }

  // Protect all /admin/* routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect to dashboard if authenticated user visits /admin/login
  if (pathname === '/admin/login' && isAuthenticated) {
    const dashboardUrl = new URL('/admin/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images / static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
