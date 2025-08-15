/**
 * Simple notification system for production use
 */

import { emailService, type SOSSessionData } from './email-service';

export class SimpleNotificationManager {
  /**
   * Send SOS session confirmation - essential functionality
   */
  static async sendSOSConfirmation(data: SOSSessionData): Promise<boolean> {
    try {
      console.log('📧 Sending SOS confirmation to:', data.userEmail);
      // Convert SOSSessionData to SOSBookingEmailData format
      const bookingData = {
        name: data.userName,
        email: data.userEmail,
        sessionTime: data.sessionTime,
        meetingLink: data.meetingLink || '',
        confirmationId: 'SOS-' + Date.now()
      };
      const success = await emailService.sendSOSConfirmation(bookingData);
      return success;
    } catch (error) {
      console.error('Failed to send SOS confirmation:', error);
      return false;
    }
  }

  /**
   * Send subscription update notification - essential functionality
   */
  static async sendSubscriptionUpdate(
    userEmail: string,
    userName: string,
    subscriptionStatus: 'active' | 'cancelled' | 'past_due'
  ): Promise<boolean> {
    try {
      console.log('📧 Sending subscription update to:', userEmail);
      
      // For now, just log the subscription update
      // In the future, this could be implemented with a proper email template
      console.log('Subscription update:', { userEmail, userName, subscriptionStatus });
      return true;
    } catch (error) {
      console.error('Failed to send subscription update:', error);
      return false;
    }
  }
}

// Export convenience functions
export const sendSOSConfirmation = SimpleNotificationManager.sendSOSConfirmation;
export const sendSubscriptionUpdate = SimpleNotificationManager.sendSubscriptionUpdate;