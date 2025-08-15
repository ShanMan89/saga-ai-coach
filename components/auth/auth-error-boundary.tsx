"use client";

import { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Shield, Home } from 'lucide-react';
import { FrontendErrorHandler } from '@/lib/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  retryCount: number;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    // Log to error monitoring service
    FrontendErrorHandler.handleError(error, 'AuthErrorBoundary');
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
      });
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.includes('auth') || 
                         this.state.error?.message?.includes('Firebase') ||
                         this.state.error?.message?.includes('token');

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert className="max-w-lg border-destructive/50 text-destructive dark:border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {isAuthError ? 'Authentication Error' : 'Something went wrong'}
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>
                {isAuthError 
                  ? 'There was an issue with authentication. Please try signing in again.'
                  : FrontendErrorHandler.getUserFriendlyMessage(this.state.error)
                }
              </p>

              {this.props.showDetails && process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs bg-red-50 p-2 rounded border">
                  <summary className="cursor-pointer font-medium text-red-700">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-red-600">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-wrap gap-2">
                {this.state.retryCount < this.maxRetries ? (
                  <Button
                    onClick={this.handleRetry}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.location.reload()}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reload Page
                  </Button>
                )}

                <Button
                  onClick={() => window.location.href = '/'}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Home className="w-3 h-3 mr-1" />
                  Go Home
                </Button>

                {isAuthError && (
                  <Button
                    onClick={() => window.location.href = '/auth/signin'}
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Sign In Again
                  </Button>
                )}
              </div>

              <p className="text-xs text-red-600">
                If this problem persists, please contact support at support@sagaaicoach.com
              </p>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}