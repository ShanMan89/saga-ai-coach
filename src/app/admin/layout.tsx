
"use client";

// All layout logic is now handled by the root AppLayout in src/components/layout/app-layout.tsx
// This file is kept to satisfy Next.js routing structure but does not need to render a layout.
// The main AppLayout will intelligently render the correct sidebar based on the route.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
