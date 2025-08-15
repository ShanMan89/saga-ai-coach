'use client';

import { getCLS, getFID, getFCP, getLCP, getTTFB, onINP, Metric } from 'web-vitals';

// Analytics endpoint for sending metrics
const ANALYTICS_ENDPOINT = '/api/analytics/web-vitals';

// Send metric to analytics
function sendToAnalytics(metric: Metric) {
  // Only send in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Web Vital:', metric);
    return;
  }

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  });

  // Use sendBeacon if available, fallback to fetch
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
  } else {
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    }).catch(console.error);
  }
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

// Rate metric performance
function rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Initialize Web Vitals tracking
export function initWebVitals() {
  try {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
    onINP(sendToAnalytics);
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

// Performance observer for custom metrics
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Monitor navigation timing
  monitorNavigation() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // Calculate custom metrics
          const metrics = {
            'dom-interactive': navEntry.domInteractive - navEntry.fetchStart,
            'dom-content-loaded': navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
            'load-complete': navEntry.loadEventEnd - navEntry.fetchStart,
            'dns-lookup': navEntry.domainLookupEnd - navEntry.domainLookupStart,
            'tcp-connect': navEntry.connectEnd - navEntry.connectStart,
            'request-response': navEntry.responseEnd - navEntry.requestStart,
          };

          Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
              this.sendCustomMetric(name, value);
            }
          });
        }
      });
    });

    try {
      observer.observe({ type: 'navigation', buffered: true });
      this.observers.set('navigation', observer);
    } catch (error) {
      console.error('Failed to observe navigation timing:', error);
    }
  }

  // Monitor resource timing
  monitorResources() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            this.sendCustomMetric('slow-resource', resourceEntry.duration, {
              name: resourceEntry.name,
              initiatorType: resourceEntry.initiatorType,
            });
          }
        }
      });
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
      this.observers.set('resource', observer);
    } catch (error) {
      console.error('Failed to observe resource timing:', error);
    }
  }

  // Monitor long tasks
  monitorLongTasks() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'longtask') {
          this.sendCustomMetric('long-task', entry.duration);
        }
      });
    });

    try {
      observer.observe({ type: 'longtask', buffered: true });
      this.observers.set('longtask', observer);
    } catch (error) {
      console.error('Failed to observe long tasks:', error);
    }
  }

  // Send custom metric
  private sendCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric = {
      name,
      value,
      rating: rateMetric(name, value),
      delta: value,
      id: `${name}-${Date.now()}-${Math.random()}`,
      url: window.location.href,
      timestamp: Date.now(),
      ...metadata,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('Custom Metric:', metric);
      return;
    }

    const body = JSON.stringify(metric);
    
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon('/api/analytics/custom-metrics', body);
    } else {
      fetch('/api/analytics/custom-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
      }).catch(console.error);
    }
  }

  // Mark performance milestones
  mark(name: string) {
    if (typeof window === 'undefined' || !('performance' in window)) return;
    
    try {
      performance.mark(name);
    } catch (error) {
      console.error('Failed to mark performance:', error);
    }
  }

  // Measure performance between marks
  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window === 'undefined' || !('performance' in window)) return;
    
    try {
      const endMarkName = endMark || `${name}-end`;
      if (endMark === undefined) {
        performance.mark(endMarkName);
      }
      
      performance.measure(name, startMark, endMarkName);
      
      const entries = performance.getEntriesByName(name, 'measure');
      const latestEntry = entries[entries.length - 1];
      
      if (latestEntry) {
        this.sendCustomMetric(name, latestEntry.duration);
      }
    } catch (error) {
      console.error('Failed to measure performance:', error);
    }
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Utility functions for measuring React component performance
export function measureComponentRender(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;
  
  return {
    start: () => monitor.mark(startMark),
    end: () => {
      monitor.mark(endMark);
      monitor.measure(`${componentName}-render`, startMark, endMark);
    },
  };
}

// Hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return { start: () => {}, end: () => {} };
  
  return measureComponentRender(componentName);
}

// Initialize all performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Initialize Web Vitals
  initWebVitals();
  
  // Initialize custom monitoring
  const monitor = PerformanceMonitor.getInstance();
  monitor.monitorNavigation();
  monitor.monitorResources();
  monitor.monitorLongTasks();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    monitor.disconnect();
  });
}