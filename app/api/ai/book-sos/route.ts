/**
 * API Route: Book SOS Session
 * POST /api/ai/book-sos
 */

import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Input validation schema
const sosBookingSchema = z.object({
  slot: z.string().datetime(),
  userProfile: z.object({
    uid: z.string(),
    subscriptionTier: z.enum(['Explorer', 'Growth', 'Transformation']),
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
    const validationResult = sosBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { slot, userProfile } = validationResult.data;

    // Verify user can only access their own data
    if (decodedToken.uid !== userProfile.uid) {
      return NextResponse.json(
        { error: 'Forbidden: Can only access your own data' },
        { status: 403 }
      );
    }

    // Check if user has SOS booking permissions
    if (userProfile.subscriptionTier === 'Explorer') {
      return NextResponse.json(
        { error: 'Upgrade required: SOS sessions are available for Growth and Transformation plans' },
        { status: 403 }
      );
    }

    // For now, return a success response
    // In production, this would integrate with a calendar system
    const result = {
      success: true,
      sessionDetails: {
        time: slot,
        duration: '50 minutes',
        meetingLink: 'https://meet.google.com/generated-link',
        instructions: 'You will receive a calendar invite shortly. Please join the meeting 5 minutes early.',
      },
      message: `Your SOS session has been booked for ${slot}. You'll receive a confirmation email shortly.`,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Book SOS session error:', error);
    return NextResponse.json(
      { error: 'Failed to book SOS session' },
      { status: 500 }
    );
  }
}