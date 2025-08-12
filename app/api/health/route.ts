import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'healthy', // Add Firebase connection check if needed
        memory: process.memoryUsage(),
      }
    };

    // Optional: Add database connectivity check
    // You can add Firebase admin connectivity check here

    return NextResponse.json(health, { status: 200 });
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