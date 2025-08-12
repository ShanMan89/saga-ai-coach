"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BookText, Users, MessageSquareHeart, BarChart } from "lucide-react";
import { OnboardingData } from "../onboarding-flow";

interface FeatureTourStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const features = [
  {
    icon: Bot,
    title: 'Saga AI Coach',
    description: 'Get instant, personalized relationship advice powered by AI. Available 24/7 to help you navigate any situation.',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: BookText,
    title: 'Smart Journaling',
    description: 'Reflect on your experiences with AI-powered insights. Track patterns, celebrate progress, and gain deeper self-awareness.',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Users,
    title: 'Anonymous Community',
    description: 'Connect with others on similar journeys. Share experiences, get support, and learn from a caring community.',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: MessageSquareHeart,
    title: 'SOS Sessions',
    description: 'Book emergency coaching sessions with relationship experts when you need immediate guidance and support.',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500'
  },
  {
    icon: BarChart,
    title: 'Progress Tracking',
    description: 'Visualize your relationship growth over time. See insights, track goals, and celebrate your achievements.',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500'
  },
];

export function FeatureTourStep({ data, onUpdate }: FeatureTourStepProps) {
  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">Your Relationship Toolkit</CardTitle>
        <CardDescription className="text-base">
          Here are the powerful features that will support your relationship journey.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          
          return (
            <div 
              key={feature.title}
              className="flex items-start space-x-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20">
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Ready to Transform Your Relationships?
          </h3>
          <p className="text-sm text-muted-foreground">
            These tools work together to provide comprehensive support for your relationship goals. 
            You can access all features from your dashboard after completing setup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">24/7</div>
          <div className="text-xs text-muted-foreground">AI Support</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">100%</div>
          <div className="text-xs text-muted-foreground">Anonymous</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">∞</div>
          <div className="text-xs text-muted-foreground">Growth Potential</div>
        </div>
      </div>
    </div>
  );
}