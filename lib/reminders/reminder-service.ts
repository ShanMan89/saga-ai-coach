/**
 * Reminder Service for SOS Sessions
 * Handles scheduling and sending of automated reminders
 */

import { addMinutes, subHours, subMinutes, isAfter, isBefore } from 'date-fns';
// import { sendSOSReminder } from '@/lib/email/notification-manager'; // Not available yet
import type { Appointment } from '@/lib/types';

export interface ReminderSchedule {
  appointmentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  sessionTime: string;
  reminderTimes: {
    twentyFourHour?: Date;
    oneHour?: Date;
    fifteenMinutes?: Date;
  };
  sentReminders: {
    twentyFourHour: boolean;
    oneHour: boolean;
    fifteenMinutes: boolean;
  };
}

export class ReminderService {
  private static instance: ReminderService;
  private reminderSchedules = new Map<string, ReminderSchedule>();

  private constructor() {}

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * Schedule reminders for a new appointment
   */
  scheduleReminders(appointment: Appointment): void {
    const sessionDate = new Date(appointment.time);
    const now = new Date();

    // Calculate reminder times
    const twentyFourHour = subHours(sessionDate, 24);
    const oneHour = subHours(sessionDate, 1);
    const fifteenMinutes = subMinutes(sessionDate, 15);

    const reminderSchedule: ReminderSchedule = {
      appointmentId: appointment.id,
      userId: appointment.userId,
      userEmail: appointment.email,
      userName: appointment.user,
      sessionTime: appointment.time,
      reminderTimes: {
        // Only schedule reminders that are in the future
        twentyFourHour: isAfter(twentyFourHour, now) ? twentyFourHour : undefined,
        oneHour: isAfter(oneHour, now) ? oneHour : undefined,
        fifteenMinutes: isAfter(fifteenMinutes, now) ? fifteenMinutes : undefined,
      },
      sentReminders: {
        twentyFourHour: false,
        oneHour: false,
        fifteenMinutes: false,
      },
    };

    this.reminderSchedules.set(appointment.id, reminderSchedule);
    
    console.log('Scheduled reminders for appointment:', appointment.id, {
      sessionTime: sessionDate.toISOString(),
      twentyFourHour: reminderSchedule.reminderTimes.twentyFourHour?.toISOString(),
      oneHour: reminderSchedule.reminderTimes.oneHour?.toISOString(),
      fifteenMinutes: reminderSchedule.reminderTimes.fifteenMinutes?.toISOString(),
    });
  }

  /**
   * Cancel reminders for an appointment
   */
  cancelReminders(appointmentId: string): void {
    this.reminderSchedules.delete(appointmentId);
    console.log('Cancelled reminders for appointment:', appointmentId);
  }

  /**
   * Process due reminders (should be called periodically)
   */
  async processDueReminders(): Promise<void> {
    const now = new Date();
    
    for (const [appointmentId, schedule] of this.reminderSchedules.entries()) {
      try {
        // Check 24-hour reminder
        if (
          schedule.reminderTimes.twentyFourHour &&
          !schedule.sentReminders.twentyFourHour &&
          isAfter(now, schedule.reminderTimes.twentyFourHour)
        ) {
          await this.sendReminder(schedule, '24h');
          schedule.sentReminders.twentyFourHour = true;
        }

        // Check 1-hour reminder
        if (
          schedule.reminderTimes.oneHour &&
          !schedule.sentReminders.oneHour &&
          isAfter(now, schedule.reminderTimes.oneHour)
        ) {
          await this.sendReminder(schedule, '1h');
          schedule.sentReminders.oneHour = true;
        }

        // Check 15-minute reminder
        if (
          schedule.reminderTimes.fifteenMinutes &&
          !schedule.sentReminders.fifteenMinutes &&
          isAfter(now, schedule.reminderTimes.fifteenMinutes)
        ) {
          await this.sendReminder(schedule, '15m');
          schedule.sentReminders.fifteenMinutes = true;
        }

        // Clean up completed reminders after session time
        const sessionDate = new Date(schedule.sessionTime);
        const sessionEndTime = addMinutes(sessionDate, 90); // 90 minutes after session start
        
        if (isAfter(now, sessionEndTime)) {
          this.reminderSchedules.delete(appointmentId);
          console.log('Cleaned up reminders for completed session:', appointmentId);
        }

      } catch (error) {
        console.error('Error processing reminder for appointment:', appointmentId, error);
      }
    }
  }

  /**
   * Send a specific reminder
   */
  private async sendReminder(schedule: ReminderSchedule, type: '24h' | '1h' | '15m'): Promise<void> {
    const sessionDate = new Date(schedule.sessionTime);
    
    const reminderMessages = {
      '24h': 'Your SOS coaching session is tomorrow',
      '1h': 'Your SOS coaching session starts in 1 hour',
      '15m': 'Your SOS coaching session starts in 15 minutes',
    };

    const reminderDetails = {
      '24h': 'Don\'t forget about your upcoming coaching session tomorrow. Take some time today to think about what you\'d like to discuss.',
      '1h': 'Your session starts soon. Make sure you\'re in a quiet, private space where you can speak freely.',
      '15m': 'Your session is starting soon! Click the meeting link below to join when ready.',
    };

    try {
      // For now, we'll use the existing SOS confirmation email structure
      // In production, you'd create specific reminder email templates
      console.log(`Sending ${type} reminder for appointment:`, schedule.appointmentId);
      
      // TODO: Implement specific reminder email templates
      // await sendSOSReminder({
      //   userEmail: schedule.userEmail,
      //   userName: schedule.userName,
      //   userId: schedule.userId,
      //   sessionTime: sessionDate.toLocaleTimeString(),
      //   sessionDate: sessionDate.toLocaleDateString(),
      //   reminderType: type,
      //   message: reminderMessages[type],
      //   details: reminderDetails[type],
      // });

      // Fallback: log the reminder for now
      console.log(`📧 Reminder sent (${type}):`, {
        to: schedule.userEmail,
        subject: reminderMessages[type],
        details: reminderDetails[type],
        sessionTime: sessionDate.toLocaleString(),
      });

    } catch (error) {
      console.error(`Failed to send ${type} reminder:`, error);
      throw error;
    }
  }

  /**
   * Get all scheduled reminders (for debugging/monitoring)
   */
  getScheduledReminders(): ReminderSchedule[] {
    return Array.from(this.reminderSchedules.values());
  }

  /**
   * Get reminder statistics
   */
  getReminderStats(): {
    totalScheduled: number;
    pendingTwentyFourHour: number;
    pendingOneHour: number;
    pendingFifteenMinutes: number;
  } {
    const schedules = Array.from(this.reminderSchedules.values());
    
    return {
      totalScheduled: schedules.length,
      pendingTwentyFourHour: schedules.filter(s => 
        s.reminderTimes.twentyFourHour && !s.sentReminders.twentyFourHour
      ).length,
      pendingOneHour: schedules.filter(s => 
        s.reminderTimes.oneHour && !s.sentReminders.oneHour
      ).length,
      pendingFifteenMinutes: schedules.filter(s => 
        s.reminderTimes.fifteenMinutes && !s.sentReminders.fifteenMinutes
      ).length,
    };
  }
}

// Singleton instance
export const reminderService = ReminderService.getInstance();

// Convenience functions
export const scheduleAppointmentReminders = (appointment: Appointment) =>
  reminderService.scheduleReminders(appointment);

export const cancelAppointmentReminders = (appointmentId: string) =>
  reminderService.cancelReminders(appointmentId);

export const processReminders = () =>
  reminderService.processDueReminders();

/**
 * Initialize reminder processing
 * In production, this would be handled by a cron job or scheduled function
 */
export const startReminderProcessor = (intervalMinutes = 5) => {
  const interval = intervalMinutes * 60 * 1000;
  
  console.log(`Starting reminder processor (checking every ${intervalMinutes} minutes)`);
  
  // Process immediately
  processReminders();
  
  // Then process at regular intervals
  const intervalId = setInterval(() => {
    processReminders().catch(error => {
      console.error('Reminder processing failed:', error);
    });
  }, interval);
  
  return intervalId;
};

/**
 * Example usage with Firebase Cloud Functions (for production)
 */
export const createReminderCloudFunctions = () => {
  // This would be implemented as Firebase Cloud Functions
  /*
  exports.processReminders = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
      await processReminders();
    });
  
  exports.scheduleRemindersOnBooking = functions.firestore
    .document('appointments/{appointmentId}')
    .onCreate(async (snap, context) => {
      const appointment = { id: snap.id, ...snap.data() } as Appointment;
      if (appointment.status === 'Upcoming') {
        scheduleAppointmentReminders(appointment);
      }
    });
  
  exports.cancelRemindersOnUpdate = functions.firestore
    .document('appointments/{appointmentId}')
    .onUpdate(async (change, context) => {
      const newData = change.after.data() as Appointment;
      if (newData.status === 'Cancelled' || newData.status === 'Completed') {
        cancelAppointmentReminders(context.params.appointmentId);
      }
    });
  */
};