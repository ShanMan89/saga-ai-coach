import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check Firebase Admin initialization
    let firebaseAdminStatus = 'unknown';
    let firebaseError = null;
    
    try {
      const { authAdmin, firestoreAdmin } = await import('@/lib/firebase-admin');
      if (authAdmin && firestoreAdmin) {
        firebaseAdminStatus = 'initialized';
      } else {
        firebaseAdminStatus = 'not_initialized';
      }
    } catch (error) {
      firebaseAdminStatus = 'error';
      firebaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Environment variable check (redacted for security)
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
    };

    // Basic health check
    const health = {
      status: firebaseAdminStatus === 'initialized' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        firebaseAdmin: {
          status: firebaseAdminStatus,
          error: firebaseError
        },
        environment: envCheck,
        memory: process.memoryUsage(),
      }
    };

    const statusCode = firebaseAdminStatus === 'initialized' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // Simple HEAD request for basic availability check
  return new NextResponse(null, { status: 200 });
}