'use server';

/**
 * @fileOverview An AI chat agent that provides personalized relationship coaching and suggests SOS sessions.
 *
 * - aiChat - A function that handles the AI chat process.
 * - AIChatInput - The input type for the aiChat function.
 * - AIChatOutput - The return type for the aiChat function.
 */

import {ai, AI_MODELS} from '@/ai/genkit';
import {z} from 'zod';
import { getAvailability } from '@/services/firestore';
import type { UserProfile, Message } from '@/lib/types';
import { firestoreAdmin } from '@/lib/firebase-admin';

// Defines a tool for the AI to check for available SOS session slots.
const getAvailabilityTool = ai.defineTool(
  {
    name: 'getAvailability',
    description: 'Returns available time slots for an SOS session with a coach. Only use this if the user is in high distress or explicitly asks for a session.',
    outputSchema: z.array(z.string()),
  },
  async () => {
    // Calls the real Firestore service to get the schedule.
    return await getAvailability(firestoreAdmin);
  }
);

// Defines the schema for the AI chat function's input.
const AIChatInputSchema = z.object({
  message: z.string().describe('The user message.'),
  userProfile: z.custom<UserProfile>().describe('The profile of the user sending the message.'),
  previousMessages: z.array(z.custom<Message>()).describe("The last 10 messages in the conversation history."),
});
export type AIChatInput = z.infer<typeof AIChatInputSchema>;

// Defines the schema for the AI chat function's output.
const AIChatOutputSchema = z.object({
    response: z.string().describe('Supportive relationship coaching response.'),
    suggestSOSText: z.boolean().describe('Whether the AI suggests an SOS session.'),
    availableSlots: z.array(z.string()).optional().describe('Available time slots for SOS session, if suggested.'),
    tone: z.enum(['supportive', 'encouraging', 'gentle', 'constructive']),
    actionItems: z.array(z.string()).optional().describe('Suggested next steps'),
    resources: z.array(z.object({
        title: z.string(),
        type: z.enum(['article', 'exercise', 'technique']),
        description: z.string()
    })).optional()
});
export type AIChatOutput = z.infer<typeof AIChatOutputSchema>;

// Main function to handle AI chat requests.
export async function aiChat(input: AIChatInput): Promise<AIChatOutput> {
  return aiChatFlow(input);
}

// Defines the Genkit flow for the AI chat logic.
const aiChatFlow = ai.defineFlow(
  {
    name: 'aiChatFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async ({ message, userProfile, previousMessages }) => {
    
    // System prompt providing context and instructions to the AI model.
    const systemPrompt = `You are Sage, an empathetic relationship coach and therapist specializing in helping people build stronger, healthier relationships. Your approach combines evidence-based therapeutic techniques with practical relationship advice.

      Core principles:
      - Be warm, supportive, and non-judgmental
      - Focus on growth, communication, and emotional intelligence
      - Provide actionable advice with specific techniques
      - Validate emotions while encouraging positive change
      - Draw from attachment theory, EFT, and cognitive behavioral approaches
      
      **Conversation Flow & SOS Sessions:**
      1.  **Provide Insightful Advice:** Offer practical, actionable advice tailored to their situation.
      2.  **Evaluate for Urgency (SOS Session):** Carefully assess the user's message for signs of high distress, crisis, or urgency.
          - **Suggest an SOS session ONLY if:**
            - The user expresses feeling overwhelmed, helpless, or in a crisis.
            - The user explicitly asks to talk to a person, book a session, or for more direct help.
            - The situation involves high conflict that seems unmanageable through text alone.
          - **If criteria are met:** You MUST use the \`getAvailability\` tool to fetch open slots. Then, incorporate the suggestion naturally into your response. For example: "It sounds like this is incredibly difficult right now. I'm noticing a few openings for a one-on-one SOS session, which might be really helpful. Would you be interested in booking one?"
          - **If you suggest a session:** Set \`suggestSOSText\` to \`true\` and include the \`availableSlots\`.
          - **Otherwise:** Set \`suggestSOSText\` to \`false\` and do not mention SOS sessions.

      **User Context:**
      - Name: ${userProfile.name}
      - Subscription Tier: ${userProfile.subscriptionTier}
      - Relationship Status: ${userProfile.relationshipStatus || 'Not specified'}
      - Goals: ${userProfile.goals?.join(', ') || 'Building healthier relationships'}
    `;

    // The user-facing prompt including conversation history.
    const prompt = `
      **Recent Conversation:**
      ${previousMessages.map(m => `${m.role}: ${m.content}`).join('
')}
      
      **Current message from ${userProfile.name}:**
      \`\`\`
      ${message}
      \`\`\`
      
      Please provide your response in the specified JSON format.
    `;
    
    // Calls the generative AI model with the defined prompts, tools, and safety settings.
    const result = await ai.generate({
        prompt: prompt,
        system: systemPrompt,
        model: AI_MODELS.CHAT,
        tools: [getAvailabilityTool],
        output: { schema: AIChatOutputSchema },
        config: {
            safetySettings: [
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            ],
        }
    });

    const output = result.output;
    
    if (!output) {
      // If the AI fails to generate a response, provide a safe fallback.
      return {
        response: "I'm not sure how to respond to that. Could you try rephrasing?",
        suggestSOSText: false,
        tone: 'gentle',
      };
    }

    // Ensures a fallback response is provided if the AI output is empty.
    return {
        ...output,
        response: output.response || "I'm not sure how to respond to that. Could you try rephrasing?",
    };
  }
);
