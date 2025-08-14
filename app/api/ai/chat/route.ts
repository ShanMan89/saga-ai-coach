/**
 * API Route: AI Chat
 * POST /api/ai/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiChatGuidanceFlow } from '@/ai/flows/ai-chat-guidance';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userProfile, previousMessages, context } = body;

    // Validate required fields
    if (!message || !userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: message, userProfile' },
        { status: 400 }
      );
    }

    // Call the AI flow
    const result = await aiChatGuidanceFlow({
      message,
      userProfile,
      previousMessages: previousMessages || [],
      context,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Chat error:', error);
    
    // Return fallback response
    return NextResponse.json({
      response: "I'm here to help with your relationship journey. Could you tell me more about what's on your mind?",
      suggestions: [
        "Tell me more about your situation",
        "What would you like to work on together?",
        "How are you feeling about this?"
      ],
      resources: [
        {
          title: "Communication Basics",
          description: "Learn fundamental communication skills for relationships",
          type: "article"
        }
      ]
    });
  }
}