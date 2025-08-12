
import { z } from "zod";
import type { Timestamp } from 'firebase-admin/firestore';

export interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: any;
}

export type SubscriptionTierType = "Explorer" | "Growth" | "Transformation";

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  avatar: string;
  subscriptionTier: SubscriptionTierType;
  messageCount: number;
  lastMessageDate?: Date;
  role: "user" | "admin";
  stripeCustomerId?: string;
  relationshipStatus?: 'single' | 'dating' | 'engaged' | 'married' | 'divorced' | 'complicated' | 'other';
  goals?: string[];
  focusAreas?: string[];
}

export const AnalyzeJournalEntryInputSchema = z.object({
  journalEntry: z.string().describe('The journal entry text to analyze.'),
  userProfile: z.custom<UserProfile>(),
});
export type AnalyzeJournalEntryInput = z.infer<typeof AnalyzeJournalEntryInputSchema>;

export const AnalyzeJournalEntryOutputSchema = z.object({
    emotionalTone: z.object({
        primary: z.enum(['positive', 'neutral', 'challenging', 'mixed']),
        emotions: z.array(z.string()),
        intensity: z.number().min(1).max(10)
    }),
    insights: z.array(z.object({
        category: z.enum(['communication', 'self-awareness', 'relationship-patterns', 'growth-opportunity']),
        insight: z.string(),
        confidence: z.number().min(0).max(1)
    })),
    patterns: z.array(z.string()).describe('Recurring themes or behaviors'),
    suggestions: z.array(z.object({
        action: z.string(),
        reasoning: z.string(),
        priority: z.enum(['low', 'medium', 'high'])
    })),
    celebratedProgress: z.array(z.string()).optional()
});
export type AnalyzeJournalEntryOutput = z.infer<typeof AnalyzeJournalEntryOutputSchema>;


export interface JournalEntry {
  id: string;
  userId: string;
  date: Date;
  content: string;
  analysis?: AnalyzeJournalEntryOutput | null;
}

export interface Appointment {
  id:string;
  userId: string;
  user: string;
  email: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  meetLink?: string; // Re-adding for backwards compatibility with dropdown menu logic
}

export interface DailySchedule {
    slots: {
        [time: string]: {
            status: 'Available' | 'Unavailable' | 'Booked';
            user?: string;
            userId?: string;
        };
    };
}


// --- Community Types ---
export interface Comment {
    id: string;
    authorId: string;
    author: string;
    avatar: string;
    content: string;
    createdAt: Date;
}

export interface Post {
    id: string;
    authorId: string;
    author: string;
    avatar: string;
    content: string;
    topic: string;
    createdAt: Date;
    likes: number;
    likedBy: string[]; // array of user IDs
    comments: Comment[];
}

// --- Content Management Types ---
export interface AudioTip {
    id: string;
    title: string;
    url: string;
    duration: number; // in seconds
    dateAdded: Date;
}


// --- Genkit Flow Schemas ---
export const BookSOSSessionInputSchema = z.object({
    slot: z.string().describe("The selected time slot for the session in ISO format."),
    userProfile: z.custom<UserProfile>().describe("The profile of the user booking the session."),
});
export type BookSOSSessionInput = z.infer<typeof BookSOSSessionInputSchema>;

export const BookSOSSessionOutputSchema = z.object({
    success: z.boolean(),
    confirmationMessage: z.string(),
    appointmentId: z.string().nullable(),
});
export type BookSOSSessionOutput = z.infer<typeof BookSOSSessionOutputSchema>;
