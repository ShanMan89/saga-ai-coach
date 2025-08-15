'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

// Error categorization
const categorizeError = (error: Error): {
  category: 'network' | 'auth' | 'validation' | 'permission' | 'system' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRetryable: boolean;
} => {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return { category: 'network', severity: 'medium', isRetryable: true };
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('auth') || message.includes('token')) {
    return { category: 'auth', severity: 'high', isRetryable: false };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return { category: 'validation', severity: 'low', isRetryable: false };
  }

  // Permission errors
  if (message.includes('permission') || message.includes('forbidden') || message.includes('access')) {
    return { category: 'permission', severity: 'medium', isRetryable: false };
  }

  // System errors
  if (stack.includes('react') || stack.includes('next') || message.includes('hydration')) {
    return { category: 'system', severity: 'high', isRetryable: true };
  }

  return { category: 'unknown', severity: 'medium', isRetryable: true };
};

// Error logging service
const logError = async (error: Error, errorInfo: ErrorInfo, errorId: string, context: any = {}) => {
  const errorData = {
    errorId,
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    ...context,
  };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  } else {
    console.error('Error logged:', errorData);
  }
};

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error
    logError(error, errorInfo, this.state.errorId, {
      level: this.props.level,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Auto-retry for retryable errors
    const { isRetryable } = categorizeError(error);
    if (isRetryable && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  scheduleRetry = () => {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
    
    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleContactSupport = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/contact';
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { category, severity, isRetryable } = categorizeError(this.state.error);
      const { maxRetries = 3, showDetails = false, level = 'component' } = this.props;
      const canRetry = isRetryable && this.state.retryCount < maxRetries;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Critical errors get full page treatment
      if (level === 'critical' || severity === 'critical') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <CardTitle className="text-red-600 dark:text-red-400">
                    Critical Error
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  A critical error occurred that prevented the application from running properly.
                  Our team has been notified and is working on a fix.
                </p>
                
                <Alert>
                  <AlertDescription>
                    Error ID: {this.state.errorId}
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={this.handleReload} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                  <Button variant="outline" onClick={this.handleContactSupport}>
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>

                {showDetails && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Technical Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component-level errors
      return (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">
                    {category === 'network' && 'Connection Error'}
                    {category === 'auth' && 'Authentication Error'}
                    {category === 'validation' && 'Validation Error'}
                    {category === 'permission' && 'Permission Error'}
                    {category === 'system' && 'System Error'}
                    {category === 'unknown' && 'Unexpected Error'}
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {category === 'network' && 'Unable to connect to the server. Please check your internet connection.'}
                    {category === 'auth' && 'Your session has expired. Please sign in again.'}
                    {category === 'validation' && 'There was a problem with the data provided.'}
                    {category === 'permission' && 'You don\'t have permission to access this resource.'}
                    {category === 'system' && 'A technical error occurred. Please try again.'}
                    {category === 'unknown' && 'Something went wrong. Please try again.'}
                  </p>
                </div>

                {this.state.retryCount > 0 && (
                  <p className="text-xs text-gray-500">
                    Retry attempt {this.state.retryCount} of {maxRetries}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {canRetry && (
                    <Button 
                      size="sm" 
                      onClick={this.handleManualRetry}
                      disabled={this.retryTimeout !== null}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Try Again
                    </Button>
                  )}
                  
                  {category === 'auth' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/auth/signin'}
                    >
                      Sign In
                    </Button>
                  )}
                  
                  {level === 'page' && (
                    <Button size="sm" variant="outline" onClick={this.handleGoHome}>
                      <Home className="w-3 h-3 mr-1" />
                      Go Home
                    </Button>
                  )}
                  
                  {severity === 'high' && (
                    <Button size="sm" variant="outline" onClick={this.handleContactSupport}>
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Report Issue
                    </Button>
                  )}
                </div>

                {showDetails && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                      Error Details
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <p><strong>Error:</strong> {this.state.error.message}</p>
                      <p><strong>ID:</strong> {this.state.errorId}</p>
                      {this.state.errorInfo && (
                        <details className="mt-1">
                          <summary className="cursor-pointer">Stack Trace</summary>
                          <pre className="mt-1 overflow-auto max-h-20 text-xs">
                            {this.state.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    // This will be caught by the nearest error boundary
    throw error;
  };
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ 
  children, 
  onError 
}: { 
  children: ReactNode; 
  onError?: (error: Error) => void; 
}) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
      onError?.(error);
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  return <>{children}</>;
}