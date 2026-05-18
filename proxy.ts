import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  buyer: '/dashboard',
  seller: '/seller/dashboard',
  admin: '/admin/dashboard',
}

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
  if (user && isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const home = ROLE_HOME[profile?.role ?? 'buyer'] ?? '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
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

  // Protect admin sub-routes
  if (pathname.startsWith('/admin/') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Protect seller routes
  if (pathname.startsWith('/seller') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'seller' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
}
