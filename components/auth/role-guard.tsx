"use client";

import { useAuth } from '@/hooks/use-auth';
import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole: 'user' | 'admin';
  fallback?: ReactNode;
  showAlert?: boolean;
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  fallback,
  showAlert = true 
}: RoleGuardProps) {
  const { profile, loading, isProfileLoading } = useAuth();

  if (loading || isProfileLoading) {
    return null;
  }

  if (!profile || profile.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showAlert) {
      return (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this content.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}