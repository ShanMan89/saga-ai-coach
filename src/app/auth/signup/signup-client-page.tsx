
"use client";

import dynamic from 'next/dynamic';

// Dynamically import the sign-up page with SSR turned off.
const SignUpPageWithNoSSR = dynamic(() => import('./page-content'), { ssr: false });

export default function SignUpClientPage() {
  return <SignUpPageWithNoSSR />;
}

    