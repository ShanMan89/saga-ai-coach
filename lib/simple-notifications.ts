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
      const success = await emailService.sendSOSConfirmation(data);
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
      
      const success = await emailService.sendSubscriptionUpdate({
        userEmail,
        userName,
        userId: '', // Not needed for basic email
        subscriptionStatus,
        planName: '',
        amount: 0,
        currency: 'USD',
        nextBillingDate: new Date(),
      });
      
      return success;
    } catch (error) {
      console.error('Failed to send subscription update:', error);
      return false;
    }
  }
}

// Export convenience functions
export const sendSOSConfirmation = SimpleNotificationManager.sendSOSConfirmation;
export const sendSubscriptionUpdate = SimpleNotificationManager.sendSubscriptionUpdate;