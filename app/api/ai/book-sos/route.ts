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
  // SOS sessions are temporarily disabled
  return NextResponse.json(
    { 
      error: 'SOS sessions temporarily unavailable',
      message: 'SOS sessions are currently disabled while we improve the experience. Please check back soon!'
    },
    { status: 503 }
  );

  /* DISABLED FOR NOW - PLANNING NEEDED
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
      // Check if slot is still available before booking
      const { getAvailability } = await import('@/services/firestore-admin');
      const availableSlots = await getAvailability();
      
      if (!availableSlots.includes(slot)) {
        return NextResponse.json(
          { 
            error: 'Slot no longer available',
            message: 'The selected time slot is no longer available. Please choose a different time.',
            availableSlots: availableSlots.slice(0, 10) // Return first 10 available slots
          },
          { status: 409 }
        );
      }

      // Book the appointment with real calendar integration
      const appointmentId = await bookAppointment(slot, fullUserProfile);
      
      // Get the created appointment to return details
      const { getAppointmentById } = await import('@/services/firestore-admin');
      const appointment = await getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('Failed to retrieve created appointment');
      }

      // Send confirmation email with retry logic
      let emailSent = false;
      let emailAttempts = 0;
      const maxEmailAttempts = 3;
      
      while (!emailSent && emailAttempts < maxEmailAttempts) {
        try {
          emailAttempts++;
          const { NotificationManager } = await import('@/lib/email/notification-manager');
          
          const sessionDate = new Date(slot);
          const notificationManager = NotificationManager.getInstance();
          emailSent = await notificationManager.sendSOSConfirmation({
            userId: fullUserProfile.uid,
            userEmail: fullUserProfile.email!,
            userName: fullUserProfile.name,
            sessionTime: sessionDate.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            }),
            sessionDate: sessionDate.toLocaleDateString(),
            meetingLink: appointment.meetLink || 'Meeting link will be provided shortly',
          });
          
          if (emailSent) {
            console.log(`SOS confirmation email sent on attempt ${emailAttempts}`);
          }
        } catch (emailError) {
          console.error(`Email attempt ${emailAttempts} failed:`, emailError);
          if (emailAttempts < maxEmailAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * emailAttempts));
          }
        }
      }

      if (!emailSent) {
        console.error('Failed to send confirmation email after all attempts');
        // Still proceed with booking success but warn user
      }

      const sessionDate = new Date(slot);
      const formattedTime = sessionDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      const result = {
        success: true,
        appointmentId,
        sessionDetails: {
          time: slot,
          formattedTime,
          duration: '60 minutes',
          meetingLink: appointment.meetLink || 'Meeting link will be provided via email shortly',
          instructions: emailSent 
            ? 'You will receive a calendar invite and confirmation email shortly. Please join the meeting 5 minutes early.'
            : 'Your appointment is confirmed. If you don\'t receive a confirmation email within 10 minutes, please contact support.',
          status: appointment.status || 'Upcoming'
        },
        confirmationMessage: `Your SOS session has been successfully booked for ${formattedTime}. ${
          emailSent 
            ? 'You\'ll receive a confirmation email with meeting details shortly.' 
            : 'Please contact support if you don\'t receive a confirmation email within 10 minutes.'
        }`,
        emailSent
      };

      return NextResponse.json(result);
    } catch (bookingError: any) {
      console.error('Booking error:', bookingError);
      
      // Provide specific error messages for common issues
      let errorMessage = 'The selected time slot may no longer be available. Please try a different time.';
      let statusCode = 409;
      
      if (bookingError.message?.includes('slot is no longer available')) {
        errorMessage = 'This time slot was just booked by another user. Please select a different time.';
      } else if (bookingError.message?.includes('Firestore')) {
        errorMessage = 'Database connection issue. Please try again in a moment.';
        statusCode = 503;
      } else if (bookingError.message?.includes('permission')) {
        errorMessage = 'You don\'t have permission to book SOS sessions. Please upgrade your plan.';
        statusCode = 403;
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to book appointment',
          message: errorMessage,
          details: bookingError.message
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('Book SOS session error:', error);
    return NextResponse.json(
      { error: 'Failed to book SOS session' },
      { status: 500 }
    );
  }
  */
}