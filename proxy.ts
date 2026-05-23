import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Exact public paths (not prefix-matched for /admin)
const PUBLIC_EXACT = ['/admin']
const PUBLIC_PREFIX = ['/login', '/register', '/forgot-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // /admin (exact) is the admin login page — always public
  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIX.some(p => pathname.startsWith(p))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect logged-in users away from public pages to their home
  // BUT: admins are ONLY redirected from admin login page, never from user login
  //       users are ONLY redirected from user login pages, never from admin login
  if (user && isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role ?? 'buyer'

    if (role === 'admin') {
      // Admin visiting /admin login → redirect to admin dashboard
      // Admin visiting /login or /register → do NOT redirect (they don't belong there)
      if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      // Let them stay on /login etc — the login form will reject them with a clear message
    } else {
      // User visiting /login or /register → redirect to their dashboard
      // User visiting /admin → do NOT redirect (admin login will reject them)
      if (pathname !== '/admin') {
        const home = role === 'seller' ? '/seller/dashboard' : '/dashboard'
        return NextResponse.redirect(new URL(home, request.url))
      }
    }
  }

  // Protect private routes — /admin/dashboard etc (not /admin itself)
  const isPrivate =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/marketplace') ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/seller') ||
    (pathname.startsWith('/admin/') && pathname !== '/admin')

  if (isPrivate && !user) {
    // Admin sub-routes redirect to /admin login, others to /login
    const loginPath = pathname.startsWith('/admin/') ? '/admin' : '/login'
    return NextResponse.redirect(new URL(loginPath, request.url))
  }

  // Role-check for protected routes — single profile query covers all cases
  const needsRoleCheck = user && (
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/seller') ||
    pathname.startsWith('/dashboard')
  )
  if (needsRoleCheck) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role

    if (pathname.startsWith('/admin/') && role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (pathname.startsWith('/seller') && role !== 'seller' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (pathname.startsWith('/dashboard') && role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
}
