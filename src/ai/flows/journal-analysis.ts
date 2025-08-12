
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
    inputSchema: AnalyzeJournalEntryInputSchema,
    outputSchema: z.nullable(AnalyzeJournalEntryOutputSchema),
  },
  async ({ journalEntry, userProfile }) => {
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
    
    const {output} = await ai.generate({
        prompt,
        model: AI_MODELS.ANALYSIS,
        output: { schema: AnalyzeJournalEntryOutputSchema },
        config: {
            safetySettings: [
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            ],
        }
    });

    if (!output) {
      console.warn("AI failed to generate a response for the journal entry. Returning null.");
      return null;
    }
    return output;
  }
);
