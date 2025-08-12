"use client";

import { useState } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookText, Heart, Lightbulb, SkipForward, Sparkles } from "lucide-react";
import { OnboardingData } from "../onboarding-flow";

interface JournalPromptStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const journalPrompts = [
  {
    icon: Heart,
    title: "Gratitude & Appreciation",
    prompt: "What is one thing you appreciate about your current relationships (with others or yourself)? How does this appreciation make you feel?",
    color: "rose"
  },
  {
    icon: Lightbulb,
    title: "Growth & Learning",
    prompt: "What's one relationship pattern you'd like to change or improve? What would success look like to you?",
    color: "amber"
  },
  {
    icon: Sparkles,
    title: "Vision & Dreams",
    prompt: "Describe your ideal relationship dynamic. What qualities would make you feel most loved and supported?",
    color: "purple"
  }
];

export function JournalPromptStep({ data, onUpdate }: JournalPromptStepProps) {
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [journalContent, setJournalContent] = useState(data.firstJournalEntry || "");

  const currentPrompt = journalPrompts[selectedPrompt];
  const Icon = currentPrompt.icon;

  const handleJournalChange = (content: string) => {
    setJournalContent(content);
    onUpdate({ firstJournalEntry: content });
  };

  const handleSkip = () => {
    onUpdate({ firstJournalEntry: undefined });
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">Your First Journal Entry</CardTitle>
        <CardDescription className="text-base">
          Start your journey with reflection. Choose a prompt that resonates with you, or feel free to skip this step.
        </CardDescription>
      </CardHeader>

      {/* Prompt Selection */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900 dark:text-white">Choose a reflection prompt:</h3>
        <div className="grid grid-cols-1 gap-3">
          {journalPrompts.map((prompt, index) => {
            const PromptIcon = prompt.icon;
            const isSelected = selectedPrompt === index;
            
            return (
              <Button
                key={index}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-3 text-left justify-start ${
                  !isSelected ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''
                }`}
                onClick={() => setSelectedPrompt(index)}
              >
                <PromptIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="font-medium">{prompt.title}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Current Prompt Display */}
      <div className={`p-4 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800 ${
        currentPrompt.color === 'rose' ? 'border-rose-400' :
        currentPrompt.color === 'amber' ? 'border-amber-400' :
        'border-purple-400'
      }`}>
        <div className="flex items-start space-x-3">
          <Icon className={`w-5 h-5 mt-0.5 ${
            currentPrompt.color === 'rose' ? 'text-rose-500' :
            currentPrompt.color === 'amber' ? 'text-amber-500' :
            'text-purple-500'
          }`} />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {currentPrompt.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentPrompt.prompt}
            </p>
          </div>
        </div>
      </div>

      {/* Journal Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Take a moment to reflect and write your thoughts..."
          value={journalContent}
          onChange={(e) => handleJournalChange(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{journalContent.length} characters</span>
          <span>This will be your first journal entry</span>
        </div>
      </div>

      {/* Optional Actions */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Skip for now
        </Button>
        
        {journalContent.trim() && (
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <BookText className="w-4 h-4 mr-1" />
            Ready to save your first entry!
          </div>
        )}
      </div>

      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Regular journaling helps you track patterns, celebrate progress, and gain insights into your relationships.
        </p>
      </div>
    </div>
  );
}