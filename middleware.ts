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
  const publicRoutes = ['/', '/auth/register', '/auth/login', '/auth/verify', '/services', '/about', '/gigs', '/pending'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route) || pathname.startsWith('/api/auth'));

  // Routes that don't require profile completion check
  const profileExemptRoutes = ['/profile', '/fixer/profile', '/fixer/pending', '/client/profile', '/api/profile', '/api/fixer/profile', '/api/client/profile', '/api/categories', '/api/auth/logout'];

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
      // Check if user status is PENDING and redirect to pending page
      // Allow /profile, /fixer/profile, /client/profile for new users to complete their profile
      const allowedPendingRoutes = ['/pending', '/profile', '/fixer/profile', '/client/profile', '/api/auth/logout', '/api/profile', '/api/fixer/profile', '/api/client/profile', '/api/categories'];
      const isAllowedForPending = allowedPendingRoutes.some(route => pathname.startsWith(route));

      if (payload.userStatus === 'PENDING' && !isAllowedForPending) {
        console.log(`[Middleware] User status is PENDING (userId: ${payload.userId}, roles: ${payload.roles?.join(',')}), redirecting to /pending from: ${pathname}`);
        return NextResponse.redirect(new URL('/pending', request.url));
      }

      // Role-based access control
      const role = payload.role;
      const roles = payload.roles || [role];

      // Admin routes
      if (pathname.startsWith('/admin') && !roles.includes('ADMIN')) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Fixer routes
      if (pathname.startsWith('/fixer') && !roles.includes('FIXER')) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Client routes
      if (pathname.startsWith('/client') && !roles.includes('CLIENT')) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Agent routes - Allow access for agents with any status except REJECTED/BANNED
      if (pathname.startsWith('/agent')) {
        console.log('[Middleware] Agent route access:', {
          pathname,
          hasAgentProfile: payload.hasAgentProfile,
          agentStatus: payload.agentStatus,
        });

        // If they don't have an agent profile, only allow /agent/application
        if (!payload.hasAgentProfile && pathname !== '/agent/application') {
          console.log('[Middleware] No agent profile, redirecting to application');
          return NextResponse.redirect(new URL('/agent/application', request.url));
        }

        // If rejected or banned, redirect to application page to see status
        if (payload.hasAgentProfile && (payload.agentStatus === 'REJECTED' || payload.agentStatus === 'BANNED')) {
          if (pathname !== '/agent/application') {
            console.log('[Middleware] Agent is REJECTED or BANNED, redirecting to application');
            return NextResponse.redirect(new URL('/agent/application', request.url));
          }
        }

        console.log('[Middleware] Allowing access to agent route');
        // Allow PENDING, ACTIVE, and SUSPENDED agents to access all agent routes
      }

      // Check if user needs to complete profile
      // Redirect to unified profile form if either profile is incomplete
      const needsProfile = (roles.includes('FIXER') && !payload.hasFixerProfile) ||
                           (roles.includes('CLIENT') && !payload.hasClientProfile);

      if (needsProfile && !profileExemptRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/profile', request.url));
      }

      // Redirect to appropriate location if accessing login/register while authenticated
      if (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/verify') {
        // Check for redirect parameter
        const redirectParam = request.nextUrl.searchParams.get('redirect');

        if (redirectParam && redirectParam.startsWith('/')) {
          // Redirect to the intended destination
          return NextResponse.redirect(new URL(redirectParam, request.url));
        }

        // Default redirects based on role(s)
        // Dual-role users go to unified dashboard
        if (roles.length > 1) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Single-role redirects
        if (roles.includes('ADMIN')) {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (roles.includes('FIXER')) {
          // Check if profile is completed before redirecting to dashboard
          if (!payload.hasProfile) {
            return NextResponse.redirect(new URL('/fixer/profile', request.url));
          }
          return NextResponse.redirect(new URL('/fixer/dashboard', request.url));
        } else if (roles.includes('CLIENT')) {
          // Clients can access homepage, so redirect there instead of dashboard
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  }

  // Add pathname to headers for layout to detect AdminLTE routes
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // Note: Page view tracking moved to client-side to avoid Prisma in middleware (Netlify limitation)
  // See app/components/AnalyticsTracker.tsx for implementation

  // Add security headers
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  );

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://js.paystack.co https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://api.paystack.co https://*.pusher.com wss://*.pusher.com https://uploadthing.com https://*.uploadthing.com",
    "frame-src 'self' https://js.stripe.com https://checkout.paystack.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
