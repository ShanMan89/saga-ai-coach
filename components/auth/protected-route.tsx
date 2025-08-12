"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { SagaLogo } from '@/components/logo';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath 
}: ProtectedRouteProps) {
  const { user, profile, loading, isProfileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || isProfileLoading) return;

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!profile) {
      return;
    }

    if (requiredRole && profile.role !== requiredRole) {
      const redirectPath = fallbackPath || (profile.role === 'admin' ? '/admin' : '/');
      router.push(redirectPath);
      return;
    }

  }, [user, profile, loading, isProfileLoading, router, requiredRole, fallbackPath]);

  if (loading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <SagaLogo className="w-12 h-12 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <SagaLogo className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

  if (requiredRole && profile.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <SagaLogo className="w-12 h-12" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}