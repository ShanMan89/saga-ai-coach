
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
});

export const AI_MODELS = {
  CHAT: 'googleai/gemini-1.5-flash', // Fast responses for chat
  ANALYSIS: 'googleai/gemini-1.5-pro', // Better analysis for journaling
};
