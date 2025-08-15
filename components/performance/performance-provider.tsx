'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring } from '@/lib/performance';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring on mount
    initializePerformanceMonitoring();
  }, []);

  return <>{children}</>;
}