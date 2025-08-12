"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Heart, MessageSquareHeart, Bot, BookText, Users } from "lucide-react";
import { WelcomeStep } from "./steps/welcome-step";
import { RelationshipStep } from "./steps/relationship-step";
import { GoalsStep } from "./steps/goals-step";
import { FeatureTourStep } from "./steps/feature-tour-step";
import { JournalPromptStep } from "./steps/journal-prompt-step";
import { useAuth } from "@/hooks/use-auth";
import { updateUserProfile } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types";

export interface OnboardingData {
  relationshipStatus?: 'single' | 'dating' | 'engaged' | 'married' | 'divorced' | 'complicated' | 'other';
  goals?: string[];
  focusAreas?: string[];
  firstJournalEntry?: string;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'relationship', title: 'Relationship', component: RelationshipStep },
  { id: 'goals', title: 'Goals', component: GoalsStep },
  { id: 'tour', title: 'Features', component: FeatureTourStep },
  { id: 'journal', title: 'First Entry', component: JournalPromptStep },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const { user, profile, services, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Redirect if already onboarded or not authenticated
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has already been onboarded (has relationship status or goals set)
    if (profile?.relationshipStatus || (profile?.goals && profile.goals.length > 0)) {
      router.push('/');
      return;
    }
  }, [user, profile, loading, router]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep]?.component;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataUpdate = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  };

  const completeOnboarding = async () => {
    if (!user || !profile || !services) return;

    setIsCompleting(true);
    try {
      // Update user profile with onboarding data
      const updates: Partial<UserProfile> = {
        relationshipStatus: onboardingData.relationshipStatus,
        goals: onboardingData.goals,
        focusAreas: onboardingData.focusAreas,
      };

      await updateUserProfile(services.firestore, user.uid, updates);

      // Create first journal entry if provided
      if (onboardingData.firstJournalEntry) {
        const { saveJournalEntry } = await import('@/services/firestore');
        await saveJournalEntry(services.firestore, user.uid, {
          content: onboardingData.firstJournalEntry,
        });
      }

      toast({
        title: "Welcome to Saga AI Coach! 🎉",
        description: "Your personalized relationship journey begins now.",
      });

      router.push('/');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete setup. Please try again.",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    switch (step?.id) {
      case 'welcome':
        return true;
      case 'relationship':
        return !!onboardingData.relationshipStatus;
      case 'goals':
        return onboardingData.goals && onboardingData.goals.length > 0;
      case 'tour':
        return true;
      case 'journal':
        return true; // Optional step
      default:
        return false;
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome Setup
              </h1>
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              {CurrentStepComponent && (
                <CurrentStepComponent
                  data={onboardingData}
                  onUpdate={handleDataUpdate}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isCompleting}
              className="flex items-center gap-2"
            >
              {currentStep === STEPS.length - 1 ? (
                isCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Heart className="w-4 h-4" />
                  </>
                )
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}