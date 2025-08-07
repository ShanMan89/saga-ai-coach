
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: This middleware is currently not in use.
// The Firebase JS SDK handles auth state on the client-side, which makes
// server-side cookie-based middleware tricky without a separate backend session mechanism.
// Auth protection is handled in the `AppLayout` component for now.
// To re-enable, you would need a mechanism to set a server-readable cookie upon auth state change.

export function middleware(request: NextRequest) {
  // This middleware is disabled. See comments above.
  return NextResponse.next();
}

// Disable the middleware by default by using a non-matching path.
export const config = {
  matcher: ['/no-match'], 
};
