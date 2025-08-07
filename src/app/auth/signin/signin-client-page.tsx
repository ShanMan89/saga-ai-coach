
"use client";

import dynamic from 'next/dynamic';

// Dynamically import the sign-in page with SSR turned off.
// This is the standard way to prevent hydration errors caused by browser extensions
// or other client-side-only modifications.
const SignInPageWithNoSSR = dynamic(() => import('./page-content'), { ssr: false });

export default function SignInClientPage() {
  return <SignInPageWithNoSSR />;
}

    