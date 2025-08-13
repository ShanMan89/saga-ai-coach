/**
 * AI Chat Guidance Flow
 * Provides personalized relationship coaching through AI-powered conversations
 */

import { defineFlow, runFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { AI_MODELS } from '../genkit';

// Types for the flow
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'Explorer' | 'Growth' | 'Transformation';
  relationshipStatus?: string;
  goals?: string[];
  focusAreas?: string[];
}

export interface ChatGuidanceInput {
  message: string;
  userProfile: UserProfile;
  previousMessages: Message[];
  context?: string;
}

export interface ChatGuidanceOutput {
  response: string;
  suggestions: string[];
  resources: Array<{
    title: string;
    description: string;
    type: 'article' | 'exercise' | 'tool';
  }>;
}

// Main AI Chat Guidance Flow
export const aiChatGuidanceFlow = defineFlow(
  {
    name: 'aiChatGuidance',
    inputSchema: {} as ChatGuidanceInput,
    outputSchema: {} as ChatGuidanceOutput,
  },
  async (input: ChatGuidanceInput): Promise<ChatGuidanceOutput> => {
    const { message, userProfile, previousMessages, context } = input;

    // Build conversation history
    const conversationHistory = previousMessages
      .map((m: Message) => `${m.role}: ${m.content}`)
      .join('\n');

    // System prompt for relationship coaching
    const systemPrompt = `You are Saga, an expert relationship coach and therapist. Your role is to provide compassionate, evidence-based guidance to help people build healthier relationships.

    User Context:
    - Name: ${userProfile.name}
    - Subscription Tier: ${userProfile.subscriptionTier}
    - Relationship Status: ${userProfile.relationshipStatus || 'Not specified'}
    - Goals: ${userProfile.goals?.join(', ') || 'Building healthier relationships'}
    - Focus Areas: ${userProfile.focusAreas?.join(', ') || 'General relationship wellness'}

    Guidelines:
    1. Be empathetic and non-judgmental
    2. Provide actionable advice
    3. Ask thoughtful follow-up questions
    4. Reference evidence-based relationship principles
    5. Tailor advice to their subscription tier and goals
    6. Keep responses conversational but professional

    Respond with JSON in this format:
    {
      "response": "Your main response to the user",
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
      "resources": [
        {
          "title": "Resource Title",
          "description": "Brief description",
          "type": "article|exercise|tool"
        }
      ]
    }`;

    // User prompt with conversation context
    const userPrompt = `
      Recent Conversation:
      ${conversationHistory}
      
      Current message from ${userProfile.name}:
      "${message}"
      
      ${context ? `Additional context: ${context}` : ''}
      
      Please provide your response in the specified JSON format.
    `;

    try {
      // Generate AI response
      const result = await generate({
        model: AI_MODELS.CHAT,
        prompt: userPrompt,
        system: systemPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      // Parse the JSON response
      const output = JSON.parse(result.text()) as ChatGuidanceOutput;

      return {
        response: output.response || "I'm here to help with your relationship journey. Could you tell me more about what's on your mind?",
        suggestions: output.suggestions || [
          "Tell me more about your situation",
          "What would you like to work on together?",
          "How are you feeling about this?"
        ],
        resources: output.resources || [
          {
            title: "Communication Basics",
            description: "Learn fundamental communication skills for relationships",
            type: "article"
          }
        ],
      };
    } catch (error) {
      console.error('AI Chat Guidance Error:', error);
      
      // Fallback response
      return {
        response: "I'm here to support you on your relationship journey. While I process your message, could you tell me more about what's most important to you right now?",
        suggestions: [
          "Share more about your relationship goals",
          "Tell me about a specific challenge you're facing",
          "Describe what a healthy relationship looks like to you"
        ],
        resources: [
          {
            title: "Getting Started with Relationship Coaching",
            description: "Introduction to building healthier relationships",
            type: "article"
          }
        ],
      };
    }
  }
);

// Export for use in other parts of the application
export default aiChatGuidanceFlow;