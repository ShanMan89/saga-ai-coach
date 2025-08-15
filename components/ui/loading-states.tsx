'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Base skeleton component with improved animations
export function EnhancedSkeleton({ 
  className, 
  animate = true,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { animate?: boolean }) {
  return (
    <div 
      className={cn(
        'bg-gray-200 dark:bg-gray-800 rounded-md',
        animate && 'animate-pulse',
        className
      )} 
      {...props}
    />
  );
}

// Loading indicator component
export function LoadingIndicator({ 
  size = 'default',
  text,
  className 
}: {
  size?: 'sm' | 'default' | 'lg';
  text?: string;
  className?: string;
}) {
  const iconSizes = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', iconSizes[size])} />
      {text && (
        <p className={cn('text-muted-foreground animate-pulse', textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus({ 
  isOnline,
  className 
}: {
  isOnline: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-500">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-orange-500">Offline</span>
        </>
      )}
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <EnhancedSkeleton className="h-8 w-48" />
        <EnhancedSkeleton className="h-4 w-96" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <EnhancedSkeleton className="h-4 w-20" />
                <EnhancedSkeleton className="h-4 w-4 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <EnhancedSkeleton className="h-8 w-16 mb-2" />
              <EnhancedSkeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <EnhancedSkeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <EnhancedSkeleton className="h-4 w-32" />
                  <EnhancedSkeleton className="h-3 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Chat skeleton
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
          <div className={cn(
            'max-w-[80%] space-y-2',
            i % 2 === 0 ? 'items-start' : 'items-end'
          )}>
            <div className="flex items-center space-x-2">
              {i % 2 === 0 && <EnhancedSkeleton className="h-6 w-6 rounded-full" />}
              <EnhancedSkeleton className="h-3 w-16" />
              {i % 2 === 1 && <EnhancedSkeleton className="h-6 w-6 rounded-full" />}
            </div>
            <EnhancedSkeleton className={cn(
              'h-12 rounded-lg',
              i % 2 === 0 ? 'w-64' : 'w-48'
            )} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Journal entries skeleton
export function JournalSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <EnhancedSkeleton className="h-5 w-32" />
              <EnhancedSkeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <EnhancedSkeleton className="h-4 w-full" />
            <EnhancedSkeleton className="h-4 w-full" />
            <EnhancedSkeleton className="h-4 w-3/4" />
            <div className="flex items-center space-x-2 pt-2">
              <EnhancedSkeleton className="h-6 w-16 rounded-full" />
              <EnhancedSkeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Community posts skeleton
export function CommunityPostsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <EnhancedSkeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <EnhancedSkeleton className="h-4 w-32" />
                <EnhancedSkeleton className="h-3 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <EnhancedSkeleton className="h-4 w-full" />
              <EnhancedSkeleton className="h-4 w-full" />
              <EnhancedSkeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-center space-x-4">
              <EnhancedSkeleton className="h-8 w-16" />
              <EnhancedSkeleton className="h-8 w-20" />
              <EnhancedSkeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <EnhancedSkeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <EnhancedSkeleton className="h-6 w-48" />
              <EnhancedSkeleton className="h-4 w-64" />
              <EnhancedSkeleton className="h-4 w-32" />
            </div>
            <EnhancedSkeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Profile sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <EnhancedSkeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <EnhancedSkeleton className="h-4 w-24" />
                <EnhancedSkeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <EnhancedSkeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <EnhancedSkeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid gap-4 py-2" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <EnhancedSkeleton 
              key={colIndex} 
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-16' : 'w-24'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Calendar skeleton
export function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <EnhancedSkeleton className="h-6 w-32" />
          <div className="flex space-x-2">
            <EnhancedSkeleton className="h-8 w-8" />
            <EnhancedSkeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton className="h-4 w-24" />
          <EnhancedSkeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-3">
        <EnhancedSkeleton className="h-10 w-24" />
        <EnhancedSkeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

// Generic content skeleton
export function ContentSkeleton({ 
  lines = 3,
  className 
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <EnhancedSkeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  );
}