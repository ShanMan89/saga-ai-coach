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

    // Get user profile from Firestore for complete booking data
    const { getUserProfile, bookAppointment } = await import('@/services/firestore-admin');
    const fullUserProfile = await getUserProfile(userProfile.uid);
    
    if (!fullUserProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    try {
      // Book the appointment with real calendar integration
      const appointmentId = await bookAppointment(slot, fullUserProfile);
      
      // Get the created appointment to return details
      const { getAppointmentById } = await import('@/services/firestore-admin');
      const appointment = await getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('Failed to retrieve created appointment');
      }

      // Send confirmation email
      try {
        const { NotificationManager } = await import('@/lib/email/notification-manager');
        
        const sessionDate = new Date(slot);
        const notificationManager = NotificationManager.getInstance();
        await notificationManager.sendSOSConfirmation({
          userId: fullUserProfile.uid,
          userEmail: fullUserProfile.email!,
          userName: fullUserProfile.name,
          sessionTime: sessionDate.toLocaleTimeString(),
          sessionDate: sessionDate.toLocaleDateString(),
          meetingLink: appointment.meetLink || 'Meeting link will be provided',
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      const result = {
        success: true,
        appointmentId,
        sessionDetails: {
          time: slot,
          duration: '60 minutes',
          meetingLink: appointment.meetLink || 'Meeting link will be provided via email',
          instructions: 'You will receive a calendar invite and confirmation email shortly. Please join the meeting 5 minutes early.',
        },
        confirmationMessage: `Your SOS session has been booked for ${new Date(slot).toLocaleString()}. You'll receive a confirmation email with meeting details shortly.`,
      };

      return NextResponse.json(result);
    } catch (bookingError: any) {
      console.error('Booking error:', bookingError);
      return NextResponse.json(
        { 
          error: 'Failed to book appointment',
          message: bookingError.message || 'The selected time slot may no longer be available. Please try a different time.'
        },
        { status: 409 }
      );
    }

  } catch (error) {
    console.error('Book SOS session error:', error);
    return NextResponse.json(
      { error: 'Failed to book SOS session' },
      { status: 500 }
    );
  }
}