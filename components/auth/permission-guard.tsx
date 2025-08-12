"use client";

import { useAuth } from '@/hooks/use-auth';
import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
  showAlert?: boolean;
}

export function PermissionGuard({ 
  children, 
  permission, 
  fallback,
  showAlert = true 
}: PermissionGuardProps) {
  const { hasPermission, loading, isProfileLoading } = useAuth();

  if (loading || isProfileLoading) {
    return null;
  }

  if (!hasPermission(permission as any)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showAlert) {
      return (
        <Alert className="border-orange-500/50 text-orange-600 dark:border-orange-500">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This feature requires a higher subscription tier.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}