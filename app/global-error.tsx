"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl text-center border-0 shadow-2xl">
            <CardHeader className="pb-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
              </div>
              
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Critical Error
              </CardTitle>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                We encountered a critical system error. Our team has been automatically notified and is working on a fix.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-left">
                  <p className="font-mono text-xs break-all text-red-800 dark:text-red-200">
                    {error.message}
                    {error.digest && (
                      <span className="block mt-2">Error ID: {error.digest}</span>
                    )}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={reset}
                  size="lg" 
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reload Application
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline" 
                  size="lg" 
                  className="border-gray-300 hover:border-gray-400"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Homepage
                </Button>
              </div>

              {/* Support Information */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Need Immediate Help?
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>📧 Email: support@sagaaicoach.com</p>
                  <p>🕐 We typically respond within 2-4 hours</p>
                  {error.digest && (
                    <p>🆔 Error ID: {error.digest}</p>
                  )}
                </div>
              </div>

              {/* Apology */}
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>We're sorry for the inconvenience.</strong> We're working hard to fix this issue 
                  so you can get back to transforming your relationships with Saga AI Coach.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}