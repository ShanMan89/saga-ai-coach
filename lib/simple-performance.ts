'use client';

// Simple performance monitoring for essential metrics only
export function initWebVitals() {
  // Only track essential metrics in production
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    return;
  }

  // Basic performance observation
  try {
    if ('performance' in window && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log critical performance issues only
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
            
            if (loadTime > 3000) {
              console.warn('Slow page load:', loadTime + 'ms');
            }
          }
        });
      });

      observer.observe({ type: 'navigation', buffered: true });
    }
  } catch (error) {
    // Silently fail - performance monitoring is not critical
  }
}

// Simple mark function for debugging
export function mark(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window && process.env.NODE_ENV === 'development') {
    try {
      performance.mark(name);
    } catch (error) {
      // Silently fail
    }
  }
}

// Simple measure function for debugging
export function measure(name: string, startMark: string, endMark?: string) {
  if (typeof window !== 'undefined' && 'performance' in window && process.env.NODE_ENV === 'development') {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
    } catch (error) {
      // Silently fail
    }
  }
}