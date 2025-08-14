/**
 * API Route: AI Journal Analysis
 * POST /api/ai/journal-analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeJournalEntry } from '@/ai/flows/journal-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journalEntry, userProfile } = body;

    // Validate required fields
    if (!journalEntry || !userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: journalEntry, userProfile' },
        { status: 400 }
      );
    }

    // Call the AI flow
    const result = await analyzeJournalEntry({
      journalEntry,
      userProfile,
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