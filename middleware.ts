
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis or external service)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to auth pages and static assets
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/api/stripe/webhooks') // Allow Stripe webhooks without rate limiting
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }

  // Check for admin API routes
  if (pathname.startsWith('/api/admin')) {
    try {
      const { requireAdminAccess } = await import('@/lib/admin-auth');
      const adminCheck = await requireAdminAccess(request);
      if (adminCheck) {
        return adminCheck; // Return error response if not admin
      }
    } catch (error) {
      console.error('Admin middleware error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Authorization check failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // AI routes have additional rate limiting based on subscription tier
  if (pathname.startsWith('/api/ai/')) {
    const aiRateLimitResult = await applyAIRateLimit(request);
    if (aiRateLimitResult) {
      return aiRateLimitResult;
    }
  }

  // Add security headers to all responses
  return addSecurityHeaders(NextResponse.next());
}

async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Base limit per window
  
  const key = `rate_limit:${ip}`;
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > current.resetTime) {
    // Reset the window
    current.count = 1;
    current.resetTime = now + windowMs;
  } else {
    current.count++;
  }
  
  rateLimitStore.set(key, current);
  
  if (current.count > maxRequests) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Rate limit exceeded', 
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }),
      { 
        status: 429, 
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, maxRequests - current.count).toString(),
          'X-RateLimit-Reset': current.resetTime.toString()
        }
      }
    );
  }
  
  return null;
}

async function applyAIRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const now = Date.now();
  let userId: string | null = null;
  let userTier: string = 'Explorer';
  
  // Get user info from Authorization header if present
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      // Import Firebase Admin to decode token
      const { authAdmin } = await import('@/lib/firebase-admin');
      if (authAdmin) {
        try {
          const decodedToken = await authAdmin.verifyIdToken(token);
          userId = decodedToken.uid;
          
          // Get user subscription tier from Firestore
          const { getUserProfile } = await import('@/services/firestore-admin');
          const userProfile = await getUserProfile(userId);
          userTier = userProfile?.subscriptionTier || 'Explorer';
        } catch (tokenError) {
          console.warn('Failed to decode token for rate limiting:', tokenError);
        }
      }
    }
  } catch (error) {
    console.warn('Error getting user info for rate limiting:', error);
  }
  
  // Set limits based on subscription tier
  let tierLimits: { maxRequests: number; windowMs: number };
  
  switch (userTier) {
    case 'Transformation':
      tierLimits = { maxRequests: 1000, windowMs: 60 * 60 * 1000 }; // 1000/hour
      break;
    case 'Growth':
      tierLimits = { maxRequests: 200, windowMs: 60 * 60 * 1000 }; // 200/hour
      break;
    case 'Explorer':
    default:
      tierLimits = { maxRequests: 20, windowMs: 60 * 60 * 1000 }; // 20/hour
      break;
  }
  
  // Use userId for rate limiting if available, otherwise fall back to IP
  const rateLimitKey = userId ? `ai_rate_limit:user:${userId}` : `ai_rate_limit:ip:${ip}`;
  const current = rateLimitStore.get(rateLimitKey) || { count: 0, resetTime: now + tierLimits.windowMs };
  
  if (now > current.resetTime) {
    current.count = 1;
    current.resetTime = now + tierLimits.windowMs;
  } else {
    current.count++;
  }
  
  rateLimitStore.set(rateLimitKey, current);
  
  if (current.count > tierLimits.maxRequests) {
    const upgradeMessage = userTier === 'Explorer' 
      ? 'Upgrade to Growth for 200 requests/hour or Transformation for 1000 requests/hour'
      : userTier === 'Growth'
      ? 'Upgrade to Transformation for 1000 requests/hour'
      : 'You have reached your rate limit';
      
    return new NextResponse(
      JSON.stringify({ 
        error: `AI rate limit exceeded for ${userTier} tier`, 
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
        upgradeMessage,
        currentTier: userTier,
        requestsRemaining: Math.max(0, tierLimits.maxRequests - current.count),
        resetTime: current.resetTime
      }),
      { 
        status: 429, 
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': tierLimits.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, tierLimits.maxRequests - current.count).toString(),
          'X-RateLimit-Reset': current.resetTime.toString()
        }
      }
    );
  }
  
  return null;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://saga-ai-coach.firebaseapp.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://api.stripe.com; frame-src https://js.stripe.com;"
  );
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
