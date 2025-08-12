"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Heart, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { SagaLogo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center border-0 shadow-2xl">
        <CardHeader className="pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center">
              <SagaLogo className="w-10 h-10" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-8xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              404
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Page Not Found
            </CardTitle>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Looks like this page took a break from the relationship. 
              Don't worry, we'll help you find your way back to love.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="border-gray-300 hover:border-gray-400">
              <Link href="/auth/signin" className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Sign In
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Popular Destinations
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link 
                href="/auth/signup" 
                className="flex items-center gap-2 text-gray-600 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Create Account
              </Link>
              <Link 
                href="/#features" 
                className="flex items-center gap-2 text-gray-600 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 transition-colors"
              >
                <Search className="w-4 h-4" />
                Features
              </Link>
              <Link 
                href="/#pricing" 
                className="flex items-center gap-2 text-gray-600 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 transition-colors"
              >
                <Heart className="w-4 h-4" />
                Pricing
              </Link>
              <Link 
                href="/help" 
                className="flex items-center gap-2 text-gray-600 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Help Center
              </Link>
            </div>
          </div>

          {/* Fun Message */}
          <div className="bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              💡 <strong>Relationship tip:</strong> Sometimes getting lost helps you discover new paths. 
              The same applies to love and relationships!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}