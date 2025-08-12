"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Heart, Users, Brain, Zap, Shield, Sparkles, Target } from "lucide-react";
import { OnboardingData } from "../onboarding-flow";

interface GoalsStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const goalOptions = [
  {
    id: 'communication',
    label: 'Better Communication',
    description: 'Learn to express needs and listen effectively',
    icon: MessageCircle,
    color: 'blue'
  },
  {
    id: 'intimacy',
    label: 'Deeper Intimacy',
    description: 'Build emotional and physical connection',
    icon: Heart,
    color: 'rose'
  },
  {
    id: 'conflict-resolution',
    label: 'Conflict Resolution',
    description: 'Handle disagreements constructively',
    icon: Shield,
    color: 'green'
  },
  {
    id: 'self-awareness',
    label: 'Self-Awareness',
    description: 'Understand your patterns and triggers',
    icon: Brain,
    color: 'purple'
  },
  {
    id: 'trust-building',
    label: 'Trust Building',
    description: 'Strengthen reliability and security',
    icon: Users,
    color: 'indigo'
  },
  {
    id: 'passion-spark',
    label: 'Reignite Passion',
    description: 'Bring back excitement and romance',
    icon: Zap,
    color: 'orange'
  },
  {
    id: 'personal-growth',
    label: 'Personal Growth',
    description: 'Become the best version of yourself',
    icon: Sparkles,
    color: 'pink'
  },
  {
    id: 'relationship-goals',
    label: 'Relationship Milestones',
    description: 'Work toward shared life goals',
    icon: Target,
    color: 'cyan'
  },
];

export function GoalsStep({ data, onUpdate }: GoalsStepProps) {
  const selectedGoals = data.goals || [];

  const handleGoalToggle = (goalId: string, checked: boolean) => {
    let updatedGoals: string[];
    
    if (checked) {
      updatedGoals = [...selectedGoals, goalId];
    } else {
      updatedGoals = selectedGoals.filter(g => g !== goalId);
    }
    
    onUpdate({ goals: updatedGoals });
  };

  const getIconColorClass = (color: string) => {
    const colorMap = {
      blue: 'text-blue-500',
      rose: 'text-rose-500',
      green: 'text-green-500',
      purple: 'text-purple-500',
      indigo: 'text-indigo-500',
      orange: 'text-orange-500',
      pink: 'text-pink-500',
      cyan: 'text-cyan-500',
    };
    return colorMap[color as keyof typeof colorMap] || 'text-gray-500';
  };

  const getBgColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 dark:bg-blue-950/20',
      rose: 'bg-rose-50 dark:bg-rose-950/20',
      green: 'bg-green-50 dark:bg-green-950/20',
      purple: 'bg-purple-50 dark:bg-purple-950/20',
      indigo: 'bg-indigo-50 dark:bg-indigo-950/20',
      orange: 'bg-orange-50 dark:bg-orange-950/20',
      pink: 'bg-pink-50 dark:bg-pink-950/20',
      cyan: 'bg-cyan-50 dark:bg-cyan-950/20',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 dark:bg-gray-950/20';
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">What are your relationship goals?</CardTitle>
        <CardDescription className="text-base">
          Select all areas where you'd like to grow. We'll personalize your coaching experience around these goals.
        </CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalOptions.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoals.includes(goal.id);
          
          return (
            <div
              key={goal.id}
              className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handleGoalToggle(goal.id, !isSelected)}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={goal.id}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleGoalToggle(goal.id, checked as boolean)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${getBgColorClass(goal.color)} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${getIconColorClass(goal.color)}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {goal.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedGoals.length > 0 && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-green-800 dark:text-green-200 font-medium">
            Perfect! You've selected {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''}. 
            We'll focus your coaching experience on these areas.
          </p>
        </div>
      )}

      {selectedGoals.length === 0 && (
        <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200">
            Please select at least one goal to continue.
          </p>
        </div>
      )}
    </div>
  );
}