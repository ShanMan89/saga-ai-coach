
import {configureGenkit, defineAction} from '@genkit-ai/core';
import {defineTool, generate} from '@genkit-ai/ai';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with Google AI plugin
// Note: For relationship coaching, we may need to handle sensitive topics
// while maintaining appropriate safety boundaries
configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  // Suppress deprecation warnings in production
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
});

export const AI_MODELS = {
  CHAT: 'googleai/gemini-1.5-flash', // Fast responses for chat
  ANALYSIS: 'googleai/gemini-1.5-pro', // Better analysis for journaling
};

// Create an ai object that exports the functions other modules expect
export const ai = {
  defineFlow: defineAction, // In Genkit v0.5, flows are implemented as actions
  defineTool, 
  generate,
};
