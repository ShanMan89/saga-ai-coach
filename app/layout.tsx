import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';

export const metadata: Metadata = {
  title: 'Saga AI Coach - Premium Relationship Coaching',
  description: 'Transform your relationships with AI-powered coaching. Get personalized guidance, journal insights, and expert SOS sessions. Join our supportive community.',
  keywords: ['relationship coaching', 'AI coach', 'couples therapy', 'relationship advice', 'personal development', 'communication skills'],
  authors: [{ name: 'Saga AI Coach Team' }],
  creator: 'Saga AI Coach',
  publisher: 'Saga AI Coach',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Saga AI Coach - Transform Your Relationships',
    description: 'Get personalized relationship coaching with AI-powered insights, expert guidance, and a supportive community.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://saga-ai-coach.com',
    siteName: 'Saga AI Coach',
    type: 'website',
    locale: 'en_US',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Saga AI Coach - Premium Relationship Coaching',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saga AI Coach - Transform Your Relationships',
    description: 'Get personalized relationship coaching with AI-powered insights and expert guidance.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AuthErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
