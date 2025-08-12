
import { config } from 'dotenv';
config();

import '@/ai/flows/journal-analysis.ts';
import '@/ai/flows/ai-chat-guidance.ts';
import '@/ai/flows/book-sos-session.ts';
import '@/ai/flows/stripe.ts';
import '@/ai/flows/ai-scenarios.ts';

