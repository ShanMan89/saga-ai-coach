"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Home, HomeIcon as HomeAlt } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingData } from "../onboarding-flow";

interface RelationshipStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const relationshipOptions = [
  { 
    value: 'single', 
    label: 'Single', 
    description: 'Ready to work on self-love and future relationships',
    icon: Heart,
    color: 'rose'
  },
  { 
    value: 'dating', 
    label: 'Dating', 
    description: 'Exploring connections and building intimacy',
    icon: Users,
    color: 'pink'
  },
  { 
    value: 'engaged', 
    label: 'Engaged', 
    description: 'Preparing for marriage and deepening commitment',
    icon: Heart,
    color: 'purple'
  },
  { 
    value: 'married', 
    label: 'Married', 
    description: 'Nurturing a lifelong partnership',
    icon: Home,
    color: 'blue'
  },
  { 
    value: 'divorced', 
    label: 'Divorced', 
    description: 'Healing and moving forward with wisdom',
    icon: Heart,
    color: 'green'
  },
  { 
    value: 'complicated', 
    label: 'It\'s Complicated', 
    description: 'Navigating complex relationship dynamics',
    icon: Users,
    color: 'orange'
  },
] as const;

export function RelationshipStep({ data, onUpdate }: RelationshipStepProps) {
  const handleStatusSelect = (status: 'single' | 'dating' | 'engaged' | 'married' | 'divorced' | 'complicated' | 'other') => {
    onUpdate({ relationshipStatus: status });
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap = {
      rose: isSelected 
        ? 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/50'
        : 'border-gray-200 hover:border-rose-200 hover:bg-rose-25 dark:border-gray-700 dark:hover:border-rose-800',
      pink: isSelected
        ? 'border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/50'
        : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25 dark:border-gray-700 dark:hover:border-pink-800',
      purple: isSelected
        ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/50'
        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25 dark:border-gray-700 dark:hover:border-purple-800',
      blue: isSelected
        ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/50'
        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-25 dark:border-gray-700 dark:hover:border-blue-800',
      green: isSelected
        ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/50'
        : 'border-gray-200 hover:border-green-200 hover:bg-green-25 dark:border-gray-700 dark:hover:border-green-800',
      orange: isSelected
        ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/50'
        : 'border-gray-200 hover:border-orange-200 hover:bg-orange-25 dark:border-gray-700 dark:hover:border-orange-800',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.rose;
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">What's your relationship status?</CardTitle>
        <CardDescription className="text-base">
          This helps us personalize your coaching experience and provide relevant guidance.
        </CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relationshipOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = data.relationshipStatus === option.value;
          
          return (
            <Button
              key={option.value}
              variant="outline"
              className={cn(
                "h-auto p-4 flex flex-col items-center space-y-3 text-left transition-all",
                getColorClasses(option.color, isSelected)
              )}
              onClick={() => handleStatusSelect(option.value)}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isSelected 
                  ? `bg-${option.color}-100 dark:bg-${option.color}-900/30`
                  : "bg-gray-100 dark:bg-gray-800"
              )}>
                <Icon className={cn(
                  "w-6 h-6",
                  isSelected 
                    ? `text-${option.color}-600 dark:text-${option.color}-400`
                    : "text-gray-500 dark:text-gray-400"
                )} />
              </div>
              
              <div className="space-y-1">
                <h3 className={cn(
                  "font-semibold",
                  isSelected 
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-200"
                )}>
                  {option.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </Button>
          );
        })}
      </div>

      {data.relationshipStatus && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-green-800 dark:text-green-200 font-medium">
            Great! We'll tailor your experience for {relationshipOptions.find(opt => opt.value === data.relationshipStatus)?.label.toLowerCase()} individuals.
          </p>
        </div>
      )}
    </div>
  );
}