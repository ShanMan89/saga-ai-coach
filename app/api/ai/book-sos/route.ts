/**
 * API Route: Book SOS Session
 * POST /api/ai/book-sos
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slot, userProfile } = body;

    // Validate required fields
    if (!slot || !userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: slot, userProfile' },
        { status: 400 }
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