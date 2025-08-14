/**
 * API Route: AI Chat
 * POST /api/ai/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiChatGuidanceFlow } from '@/ai/flows/ai-chat-guidance';
import { authAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Input validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  userProfile: z.object({
    uid: z.string(),
    subscriptionTier: z.enum(['Explorer', 'Growth', 'Transformation']),
    messageCount: z.number().optional(),
  }),
  previousMessages: z.array(z.any()).optional(),
  context: z.string().optional(),
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
    const validationResult = chatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { message, userProfile, previousMessages, context } = validationResult.data;

    // Verify user can only access their own data
    if (decodedToken.uid !== userProfile.uid) {
      return NextResponse.json(
        { error: 'Forbidden: Can only access your own data' },
        { status: 403 }
      );
    }

    // Rate limiting based on subscription tier
    // Explorer: 10 messages per month, Growth/Transformation: unlimited
    if (userProfile.subscriptionTier === 'Explorer') {
      const explorerLimit = 10;
      if (userProfile.messageCount && userProfile.messageCount >= explorerLimit) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Upgrade to Growth or Transformation for unlimited AI chat.' },
          { status: 429 }
        );
      }
    }
    // Growth and Transformation have unlimited chat

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