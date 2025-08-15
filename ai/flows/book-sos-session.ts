
'use server';

/**
 * @fileOverview A flow for booking an SOS session with a coach.
 * This flow now uses a Firestore-based booking system instead of Google Calendar.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { bookAppointment } from '@/services/firestore-admin';
import type { BookSOSSessionInput, BookSOSSessionOutput, UserProfile } from '@/lib/types';
import { BookSOSSessionInputSchema, BookSOSSessionOutputSchema } from '@/lib/types';
import { sendSOSConfirmation } from '@/lib/email/notification-manager';

const bookAppointmentTool = ai.defineTool(
  {
    name: 'bookAppointmentTool',
    description: 'Creates an appointment document in Firestore and updates the admin schedule to mark the slot as booked.',
    inputSchema: z.object({
        slot: z.string().describe("The selected time slot for the session."),
        userProfile: z.custom<UserProfile>().describe("The profile of the user booking the session."),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        appointmentId: z.string().nullable(),
    }),
  },
  async ({ slot, userProfile }) => {
    try {
        const appointmentId = await bookAppointment(slot, userProfile);
        return { success: true, appointmentId };
    } catch(error: any) {
        console.error("Error in bookAppointmentTool", error);
        // Pass a more specific error message if available
        const message = error.message || "An unknown error occurred while booking.";
        throw new Error(message);
    }
  }
);

export async function bookSOSSession(input: BookSOSSessionInput): Promise<BookSOSSessionOutput> {
  return bookSOSSessionFlow(input);
}

const bookSOSSessionFlow = ai.defineFlow(
    {
        name: 'bookSOSSessionFlow',
        actionType: 'flow',
        inputSchema: BookSOSSessionInputSchema,
        outputSchema: BookSOSSessionOutputSchema,
    },
    async (input: BookSOSSessionInput) => {
        // Booking flow started for user ${input.userProfile.uid} for slot: ${input.slot}
        
        try {
            const { success, appointmentId } = await bookAppointmentTool({ slot: input.slot, userProfile: input.userProfile });
            if (success && appointmentId) {
                // Send confirmation email with meeting details
                try {
                    const sessionDate = new Date(input.slot);
                    
                    // Create meeting link for the appointment
                    let meetingLink: string | undefined;
                    try {
                        const { meetingService } = await import('@/lib/video/meeting-service');
                        const meeting = await meetingService.createMeetingForAppointment(
                            appointmentId,
                            input.slot,
                            60, // 60 minute session
                            undefined, // Host email - could be admin email
                            input.userProfile.email || undefined,
                            input.userProfile.name
                        );
                        meetingLink = meeting.joinUrl;
                        console.log('Meeting created for appointment:', appointmentId);
                    } catch (error) {
                        console.error('Failed to create meeting link:', error);
                        // Continue with booking even if meeting creation fails
                    }
                    
                    await sendSOSConfirmation({
                        userEmail: input.userProfile.email || '',
                        userName: input.userProfile.name,
                        userId: input.userProfile.uid,
                        sessionTime: sessionDate.toLocaleTimeString(),
                        sessionDate: sessionDate.toLocaleDateString(),
                        meetingLink,
                    });
                } catch (emailError) {
                    console.error('Failed to send SOS confirmation email:', emailError);
                    // Don't fail the booking if email fails
                }

                return {
                    success: true,
                    confirmationMessage: `Your SOS session for ${new Date(input.slot).toLocaleString()} is confirmed! You can view your appointment details in your profile.`,
                    appointmentId: appointmentId,
                };
            } else {
                 return {
                    success: false,
                    confirmationMessage: 'Sorry, there was an issue booking your session. The slot may have been taken. Please try again.',
                    appointmentId: null,
                };
            }
        } catch (error: any) {
            console.error(`Booking flow failed for user ${input.userProfile.uid}:`, error.message);
            return {
                success: false,
                confirmationMessage: `Sorry, there was an issue booking your session: ${error.message}`,
                appointmentId: null,
            };
        }
    }
);
