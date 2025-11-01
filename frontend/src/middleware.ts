import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for route protection and security
 *
 * This middleware runs at the edge before routes are accessed,
 * providing faster authentication checks and better security.
 */

// Routes that require authentication
const protectedPaths = [
  '/dashboard',
  '/production',
  '/terminal',
  '/reconciliation',
  '/partners',
  '/settings',
  '/profile',
  '/payment',
  '/reports',
]

// Routes that should redirect authenticated users
const authPaths = [
  '/auth/login',
  '/auth/register',
]

// Routes that should be blocked in production
const devOnlyPaths = [
  '/demo-admin',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block dev-only routes in production
  if (process.env.NODE_ENV === 'production') {
    if (devOnlyPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Check for auth token in sessionStorage (via cookie)
  const authToken = request.cookies.get('auth-token')
  const isAuthenticated = !!authToken

  // Protect routes that require authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  if (isProtectedPath && !isAuthenticated) {
    // Store the intended destination
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))
  if (isAuthPath && isAuthenticated) {
    const redirect = request.nextUrl.searchParams.get('redirect')
    return NextResponse.redirect(new URL(redirect || '/dashboard', request.url))
  }

  // Add security headers to response
  const response = NextResponse.next()

  // Additional security for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
  }

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
