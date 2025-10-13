import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/auth-jwt';

export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Debug logging for dashboard routes
  if (pathname.includes('/dashboard')) {
    console.log(`[Middleware] ${pathname} - Has token: ${!!token}`);
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/register', '/auth/login', '/auth/verify', '/services', '/about', '/gigs'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route) || pathname.startsWith('/api/auth'));

  // Routes that don't require profile completion check
  const profileExemptRoutes = ['/fixer/profile', '/fixer/pending', '/client/profile', '/api/fixer/profile', '/api/client/profile', '/api/categories', '/api/auth/logout'];

  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    // Store the intended destination for redirect after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If has token, verify it
  if (token) {
    const payload = verifySessionToken(token);

    if (pathname.includes('/dashboard')) {
      console.log(`[Middleware] Token verification result:`, { hasPayload: !!payload, role: payload?.role });
    }

    // Invalid token
    if (!payload && !isPublicRoute) {
      console.log(`[Middleware] Invalid token, redirecting to login from: ${pathname}`);
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }

    if (payload) {
      // Role-based access control
      const role = payload.role;

      // Admin routes
      if (pathname.startsWith('/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Fixer routes
      if (pathname.startsWith('/fixer') && role !== 'FIXER') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Client routes
      if (pathname.startsWith('/client') && role !== 'CLIENT') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Check if fixer needs to complete profile
      if (role === 'FIXER' && !payload.hasProfile && !profileExemptRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/fixer/profile', request.url));
      }

      // Check if client needs to complete profile
      if (role === 'CLIENT' && !payload.hasProfile && !profileExemptRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/client/profile', request.url));
      }

      // Redirect to appropriate location if accessing login/register while authenticated
      if (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/verify') {
        // Check for redirect parameter
        const redirectParam = request.nextUrl.searchParams.get('redirect');

        if (redirectParam && redirectParam.startsWith('/')) {
          // Redirect to the intended destination
          return NextResponse.redirect(new URL(redirectParam, request.url));
        }

        // Default redirects based on role
        if (role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (role === 'FIXER') {
          // Check if profile is completed before redirecting to dashboard
          if (!payload.hasProfile) {
            return NextResponse.redirect(new URL('/fixer/profile', request.url));
          }
          return NextResponse.redirect(new URL('/fixer/dashboard', request.url));
        } else if (role === 'CLIENT') {
          // Clients can access homepage, so redirect there instead of dashboard
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/webhooks).*)',
  ],
};
