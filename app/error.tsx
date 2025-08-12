"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Home, Heart, AlertTriangle, Bug } from "lucide-react";
import Link from "next/link";
import { SagaLogo } from "@/components/logo";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
  const isAuthError = error.message?.includes('auth') || error.message?.includes('permission');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center border-0 shadow-2xl">
        <CardHeader className="pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            {isNetworkError 
              ? "We're having trouble connecting. Please check your internet connection."
              : isAuthError
              ? "There seems to be an authentication issue. Please try signing in again."
              : "We encountered an unexpected error. Our team has been notified and is working on a fix."
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Details (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <Alert className="text-left">
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs break-all">
                {error.message}
                {error.digest && (
                  <div className="mt-2">Error ID: {error.digest}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={reset}
              size="lg" 
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
            <Button asChild variant="outline" size="lg" className="border-gray-300 hover:border-gray-400">
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Helpful Actions */}
          {isNetworkError && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Connection Issues?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Wait a moment and try again</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>
          )}

          {isAuthError && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Authentication Issue
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                Please try signing out and signing back in.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/signin">
                  Sign In Again
                </Link>
              </Button>
            </div>
          )}

          {/* Support Links */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Need help? Our support team is here for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
              <Link 
                href="/help" 
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
              >
                Help Center
              </Link>
              <Link 
                href="/contact" 
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
              >
                Contact Support
              </Link>
              <Link 
                href="/#testimonials" 
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
              >
                Community
              </Link>
            </div>
          </div>

          {/* Encouragement */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <Heart className="w-4 h-4 inline mr-1 text-green-600" />
              <strong>Remember:</strong> Every challenge is an opportunity to grow stronger together. 
              We'll get through this technical hiccup just like you'll get through relationship challenges!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}