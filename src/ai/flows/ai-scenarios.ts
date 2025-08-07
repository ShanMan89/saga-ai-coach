
'use server';

/**
 * @fileOverview A Genkit flow for generating AI-powered practice scenarios.
 *
 * - generateScenario - A function that creates a relationship practice scenario.
 */

import { ai, AI_MODELS } from '@/ai/genkit';
import { z } from 'zod';
import type { UserProfile } from '@/lib/types';

const ScenarioSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  scenario: z.object({
    setup: z.string(),
    characters: z.array(z.object({
      name: z.string(),
      role: z.string(),
      personality: z.string()
    })),
    situation: z.string(),
    challenge: z.string()
  }),
  learningObjectives: z.array(z.string()),
  practiceAreas: z.array(z.enum([
    'active-listening', 'empathy', 'boundary-setting', 'conflict-resolution',
    'emotional-regulation', 'assertiveness', 'vulnerability', 'trust-building'
  ])),
  suggestedResponses: z.array(z.object({
    approach: z.string(),
    response: z.string(),
    reasoning: z.string()
  }))
});

const ScenarioGeneratorInputSchema = z.object({
  category: z.enum([
    'communication', 'conflict-resolution', 'intimacy', 'boundaries',
    'trust-building', 'emotional-support', 'family-dynamics', 'friendship'
  ]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  userProfile: z.custom<UserProfile>(),
  personalizedContext: z.string().optional()
});
export type ScenarioGeneratorInput = z.infer<typeof ScenarioGeneratorInputSchema>;
export type ScenarioOutput = z.infer<typeof ScenarioSchema>;

export async function generateScenario(input: ScenarioGeneratorInput): Promise<ScenarioOutput> {
  return scenarioGeneratorFlow(input);
}


const scenarioGeneratorFlow = ai.defineFlow(
  {
    name: 'generateScenarioFlow',
    inputSchema: ScenarioGeneratorInputSchema,
    outputSchema: ScenarioSchema,
  },
  async ({ category, difficulty, userProfile, personalizedContext }) => {
    
    const prompt = `Create a realistic relationship scenario for practice and learning. Design an interactive situation that helps users develop specific relationship skills.

    Requirements:
    - Category: ${category}
    - Difficulty: ${difficulty}
    - User Goals: ${userProfile.goals?.join(', ') || 'General relationship skills'}
    - Personal Context: ${personalizedContext || 'General relationship context'}
    
    Guidelines:
    - Create relatable, realistic scenarios
    - Include clear learning objectives
    - Provide multiple response options with explanations
    - Make it emotionally safe but challenging
    - Focus on skill development and growth
    - Include diverse relationship contexts (romantic, family, friends, colleagues)
    
    The scenario should be interactive and educational, helping users practice real-world relationship skills in a safe environment.`;

    const { output } = await ai.generate({
      model: AI_MODELS.ANALYSIS, // Using a more powerful model for creative generation
      prompt: prompt,
      output: {
        schema: ScenarioSchema,
      },
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
        throw new Error("Failed to generate a scenario from the AI.");
    }
    return output;
  }
);
