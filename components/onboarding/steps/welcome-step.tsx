"use client";

import { Heart, Sparkles, Users, Bot } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingData } from "../onboarding-flow";

interface WelcomeStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

export function WelcomeStep({ data, onUpdate }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-white" />
        </div>
        
        <CardHeader className="p-0">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
            Welcome to Saga AI Coach
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Your personalized relationship coaching journey starts here
          </CardDescription>
        </CardHeader>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="flex items-start space-x-3 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
          <Bot className="w-6 h-6 text-rose-500 mt-1" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Guidance</h3>
            <p className="text-sm text-muted-foreground">Get personalized advice and insights</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
          <Users className="w-6 h-6 text-pink-500 mt-1" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Supportive Community</h3>
            <p className="text-sm text-muted-foreground">Connect with others on similar journeys</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <Sparkles className="w-6 h-6 text-purple-500 mt-1" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Personal Growth</h3>
            <p className="text-sm text-muted-foreground">Track your progress and celebrate wins</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Heart className="w-6 h-6 text-blue-500 mt-1" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Expert Sessions</h3>
            <p className="text-sm text-muted-foreground">Book SOS sessions when you need them</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 p-6 rounded-xl">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="secondary" className="bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200">
            2 minutes
          </Badge>
          <span className="text-sm text-muted-foreground">to complete setup</span>
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300">
          Let's personalize your experience to give you the most relevant guidance and support.
        </p>
      </div>
    </div>
  );
}