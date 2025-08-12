/**
 * Notification Manager
 * Central hub for managing all notifications across the application
 */

import { emailService, type SOSSessionData, type JournalReminderData, type CommunityNotificationData, type SubscriptionData } from './email-service';
import { NotificationType, type NotificationPreferences, type ScheduledNotification, NotificationScheduler, defaultNotificationPreferences } from './notification-types';

export class NotificationManager {
  private static instance: NotificationManager;

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Send SOS session confirmation
   */
  async sendSOSConfirmation(data: SOSSessionData): Promise<boolean> {
    try {
      console.log('📧 Sending SOS confirmation to:', data.userEmail);
      
      // In production, check user preferences first
      const userPrefs = await this.getUserNotificationPreferences(data.userId);
      if (!this.shouldSendNotification(NotificationType.SOS_CONFIRMATION, userPrefs)) {
        console.log('⏭️ SOS confirmation skipped due to user preferences');
        return false;
      }

      const success = await emailService.sendSOSConfirmation(data);
      
      if (success) {
        // Log notification sent
        await this.logNotificationSent(data.userId, NotificationType.SOS_CONFIRMATION, data);
      }

      return success;
    } catch (error) {
      console.error('Failed to send SOS confirmation:', error);
      return false;
    }
  }

  /**
   * Send journal reminder
   */
  async sendJournalReminder(data: JournalReminderData): Promise<boolean> {
    try {
      console.log('📧 Sending journal reminder to:', data.userEmail);
      
      const userPrefs = await this.getUserNotificationPreferences(data.userId);
      if (!this.shouldSendNotification(NotificationType.JOURNAL_REMINDER, userPrefs)) {
        console.log('⏭️ Journal reminder skipped due to user preferences');
        return false;
      }

      const success = await emailService.sendJournalReminder(data);
      
      if (success) {
        await this.logNotificationSent(data.userId, NotificationType.JOURNAL_REMINDER, data);
      }

      return success;
    } catch (error) {
      console.error('Failed to send journal reminder:', error);
      return false;
    }
  }

  /**
   * Send community notification
   */
  async sendCommunityNotification(data: CommunityNotificationData): Promise<boolean> {
    try {
      console.log('📧 Sending community notification to:', data.userEmail);
      
      const notificationType = this.getCommunityNotificationType(data.notificationType);
      const userPrefs = await this.getUserNotificationPreferences(data.userId);
      
      if (!this.shouldSendNotification(notificationType, userPrefs)) {
        console.log('⏭️ Community notification skipped due to user preferences');
        return false;
      }

      const success = await emailService.sendCommunityNotification(data);
      
      if (success) {
        await this.logNotificationSent(data.userId, notificationType, data);
      }

      return success;
    } catch (error) {
      console.error('Failed to send community notification:', error);
      return false;
    }
  }

  /**
   * Send subscription update
   */
  async sendSubscriptionUpdate(data: SubscriptionData): Promise<boolean> {
    try {
      console.log('📧 Sending subscription update to:', data.userEmail);
      
      const notificationType = this.getSubscriptionNotificationType(data.subscriptionStatus);
      const userPrefs = await this.getUserNotificationPreferences(data.userId);
      
      if (!this.shouldSendNotification(notificationType, userPrefs)) {
        console.log('⏭️ Subscription notification skipped due to user preferences');
        return false;
      }

      const success = await emailService.sendSubscriptionUpdate(data);
      
      if (success) {
        await this.logNotificationSent(data.userId, notificationType, data);
      }

      return success;
    } catch (error) {
      console.error('Failed to send subscription update:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for later delivery
   */
  async scheduleNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any>,
    scheduledFor: Date
  ): Promise<string | null> {
    try {
      // In production, this would save to database
      const notification: ScheduledNotification = {
        id: this.generateNotificationId(),
        userId,
        type,
        scheduledFor,
        data,
        status: 'pending',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('📅 Scheduled notification:', {
        id: notification.id,
        type: notification.type,
        scheduledFor: notification.scheduledFor,
        userId: notification.userId,
      });

      // TODO: Save to database
      // await this.saveScheduledNotification(notification);

      return notification.id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // TODO: Fetch from database
      // For now, return default preferences
      return {
        ...defaultNotificationPreferences,
        userId,
      };
    } catch (error) {
      console.error('Failed to get user preferences, using defaults:', error);
      return {
        ...defaultNotificationPreferences,
        userId,
      };
    }
  }

  /**
   * Check if notification should be sent based on user preferences and frequency rules
   */
  private shouldSendNotification(type: NotificationType, userPrefs: NotificationPreferences): boolean {
    if (!userPrefs.email.enabled) {
      return false;
    }

    // Check if user has enabled this specific notification type
    if (!userPrefs.email.types[type]) {
      return false;
    }

    // TODO: Check frequency rules with last sent times from database
    // For now, allow all notifications
    return true;
  }

  /**
   * Log that a notification was sent
   */
  private async logNotificationSent(
    userId: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<void> {
    try {
      console.log('📝 Logging notification sent:', {
        userId,
        type,
        timestamp: new Date().toISOString(),
      });

      // TODO: Save to database for analytics and frequency control
      // await this.saveNotificationLog(userId, type, data);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Map community notification types to internal types
   */
  private getCommunityNotificationType(type: 'like' | 'comment' | 'mention'): NotificationType {
    const mapping = {
      like: NotificationType.COMMUNITY_POST_LIKE,
      comment: NotificationType.COMMUNITY_POST_COMMENT,
      mention: NotificationType.COMMUNITY_MENTION,
    };
    return mapping[type];
  }

  /**
   * Map subscription status to notification types
   */
  private getSubscriptionNotificationType(status: 'active' | 'cancelled' | 'past_due'): NotificationType {
    const mapping = {
      active: NotificationType.SUBSCRIPTION_CONFIRMATION,
      cancelled: NotificationType.SUBSCRIPTION_CANCELLED,
      past_due: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
    };
    return mapping[status];
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Bulk operations for scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      console.log('⏰ Processing scheduled notifications...');
      
      // TODO: Implement scheduled notification processing
      // 1. Fetch pending notifications that are due
      // 2. Process each notification
      // 3. Update status based on success/failure
      // 4. Handle retries for failed notifications
      
      console.log('✅ Scheduled notifications processed');
    } catch (error) {
      console.error('Failed to process scheduled notifications:', error);
    }
  }

  /**
   * Send daily digest notifications
   */
  async sendDailyDigest(): Promise<void> {
    try {
      console.log('📰 Sending daily digest notifications...');
      
      // TODO: Implement daily digest
      // 1. Fetch users who have enabled daily digest
      // 2. Compile digest content for each user
      // 3. Send digest email
      
      console.log('✅ Daily digest notifications sent');
    } catch (error) {
      console.error('Failed to send daily digest:', error);
    }
  }

  /**
   * Send weekly insights
   */
  async sendWeeklyInsights(): Promise<void> {
    try {
      console.log('📊 Sending weekly insights...');
      
      // TODO: Implement weekly insights
      // 1. Generate AI-powered insights for each user
      // 2. Include journal analysis, relationship progress, etc.
      // 3. Send personalized insights email
      
      console.log('✅ Weekly insights sent');
    } catch (error) {
      console.error('Failed to send weekly insights:', error);
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

// Convenience functions
export const sendSOSConfirmation = (data: SOSSessionData) => 
  notificationManager.sendSOSConfirmation(data);

export const sendJournalReminder = (data: JournalReminderData) => 
  notificationManager.sendJournalReminder(data);

export const sendCommunityNotification = (data: CommunityNotificationData) => 
  notificationManager.sendCommunityNotification(data);

export const sendSubscriptionUpdate = (data: SubscriptionData) => 
  notificationManager.sendSubscriptionUpdate(data);