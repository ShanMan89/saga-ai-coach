/**
 * API Route: AI Journal Analysis
 * POST /api/ai/journal-analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeJournalEntry } from '@/ai/flows/journal-analysis';
import { authAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Input validation schema
const journalAnalysisSchema = z.object({
  journalEntry: z.string().min(10).max(10000),
  userProfile: z.object({
    uid: z.string(),
    subscriptionTier: z.enum(['Explorer', 'Growth', 'Transformation']),
    goals: z.array(z.string()).optional(),
    focusAreas: z.array(z.string()).optional(),
    relationshipStatus: z.enum(['single', 'dating', 'engaged', 'married', 'divorced', 'complicated', 'other']).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    if (!authAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await authAdmin.verifyIdToken(token);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = journalAnalysisSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { journalEntry, userProfile } = validationResult.data;

    // Verify user can only access their own data
    if (decodedToken.uid !== userProfile.uid) {
      return NextResponse.json(
        { error: 'Forbidden: Can only access your own data' },
        { status: 403 }
      );
    }

    // Check if user has permission for journal analysis
    if (userProfile.subscriptionTier === 'Explorer') {
      return NextResponse.json(
        { error: 'Upgrade required: Journal analysis is available for Growth and Transformation plans' },
        { status: 403 }
      );
    }

    // Call the AI flow
    const result = await analyzeJournalEntry({
      journalEntry,
      userProfile: {
        uid: userProfile.uid,
        email: decodedToken.email || null,
        name: decodedToken.name || 'User',
        avatar: '',
        subscriptionTier: userProfile.subscriptionTier,
        messageCount: 0,
        role: 'user',
        goals: userProfile.goals || [],
        focusAreas: userProfile.focusAreas || [],
        relationshipStatus: userProfile.relationshipStatus
      },
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Journal Analysis error:', error);
    
    // Return fallback response
    return NextResponse.json({
      emotionalTone: {
        primary: "neutral",
        intensity: 5,
        emotions: ["reflective"]
      },
      insights: [
        {
          category: "self-reflection",
          insight: "This entry shows thoughtful self-reflection and awareness."
        }
      ],
      patterns: [
        "Regular journaling demonstrates commitment to personal growth."
      ],
      suggestions: [
        {
          action: "Continue regular journaling practice",
          reasoning: "Consistent reflection helps process emotions and track progress."
        }
      ]
    });
  }
}