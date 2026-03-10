import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/courses', '/profile', '/admin', '/onboarding']
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // Handle authenticated users' state transitions
  if (user) {
    // Fetch profile for deeper checks
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, department, role, is_active')
      .eq('id', user.id)
      .single()

    // 1. Suspension check
    if (profile?.is_active === false && path !== '/login') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'Your account has been suspended.')
      return NextResponse.redirect(loginUrl)
    }

    // 2. Onboarding check
    const isProfileComplete = Boolean(profile?.full_name && profile?.department)
    if (!isProfileComplete && path !== '/onboarding' && path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    if (isProfileComplete && path === '/onboarding') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 3. Admin protection
    if (path.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 4. Redirect away from login
    if (path === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
