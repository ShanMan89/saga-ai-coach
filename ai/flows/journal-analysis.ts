
'use server';

/**
 * @fileOverview Analyzes journal entries for sentiment and patterns.
 *
 * - analyzeJournalEntry - A function that analyzes a journal entry for sentiment and patterns.
 * - AnalyzeJournalEntryInput - The input type for the analyzeJournalEntry function.
 * - AnalyzeJournalEntryOutput - The return type for the analyzeJournalEntry function.
 */

import {ai, AI_MODELS} from '@/ai/genkit';
import {z} from 'zod';
import type { UserProfile, AnalyzeJournalEntryInput, AnalyzeJournalEntryOutput } from '@/lib/types';
import { AnalyzeJournalEntryInputSchema, AnalyzeJournalEntryOutputSchema } from '@/lib/types';

export async function analyzeJournalEntry(input: AnalyzeJournalEntryInput): Promise<AnalyzeJournalEntryOutput | null> {
  return analyzeJournalEntryFlow(input);
}


const analyzeJournalEntryFlow = ai.defineFlow(
  {
    name: 'analyzeJournalEntryFlow',
    actionType: 'flow',
    inputSchema: AnalyzeJournalEntryInputSchema,
    outputSchema: z.nullable(AnalyzeJournalEntryOutputSchema),
  },
  async ({ journalEntry, userProfile }: AnalyzeJournalEntryInput) => {
    const prompt = `You are an expert relationship therapist analyzing a personal journal entry. Provide insightful, compassionate analysis that helps the user understand their emotions, patterns, and growth opportunities.

    User Profile:
    - Name: ${userProfile.name}
    - Goals: ${userProfile.goals?.join(', ') || 'Personal growth'}
    - Relationship Status: ${userProfile.relationshipStatus || 'Not specified'}
    - Focus Areas: ${userProfile.focusAreas?.join(', ') || 'General relationship wellness'}
    
    Current journal entry:
    \`\`\`
    ${journalEntry}
    \`\`\`
    
    Analyze this entry focusing on:
    1. Emotional awareness and processing
    2. Relationship dynamics and communication patterns
    3. Personal growth indicators
    4. Areas for development
    5. Positive progress to celebrate
    
    Be encouraging and constructive. Identify specific, actionable insights. Please provide the output in the specified JSON format.
  `;
    
    const result = await ai.generate({
        model: AI_MODELS.ANALYSIS,
        prompt: prompt,
        output: { 
          format: 'json',
          schema: AnalyzeJournalEntryOutputSchema 
        },
        config: {
            // Configuration for Gemini models
        }
    });

    const output = result.output();

    if (!output) {
      console.warn("AI failed to generate a response for the journal entry. Returning null.");
      return null;
    }
    return output;
  }
);
