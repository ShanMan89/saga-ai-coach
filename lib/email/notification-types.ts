/**
 * Notification Types and Configurations
 * Defines all the types of notifications that can be sent
 */

export enum NotificationType {
  // SOS Session Notifications
  SOS_CONFIRMATION = 'sos_confirmation',
  SOS_REMINDER = 'sos_reminder',
  SOS_FOLLOWUP = 'sos_followup',

  // Journal Notifications
  JOURNAL_REMINDER = 'journal_reminder',
  JOURNAL_STREAK_CELEBRATION = 'journal_streak_celebration',
  JOURNAL_WEEKLY_INSIGHTS = 'journal_weekly_insights',

  // Community Notifications
  COMMUNITY_POST_LIKE = 'community_post_like',
  COMMUNITY_POST_COMMENT = 'community_post_comment',
  COMMUNITY_MENTION = 'community_mention',
  COMMUNITY_WEEKLY_DIGEST = 'community_weekly_digest',

  // Subscription Notifications
  SUBSCRIPTION_CONFIRMATION = 'subscription_confirmation',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
  SUBSCRIPTION_RENEWAL_REMINDER = 'subscription_renewal_reminder',

  // Onboarding & Welcome
  WELCOME_EMAIL = 'welcome_email',
  ONBOARDING_INCOMPLETE = 'onboarding_incomplete',
  FEATURE_INTRODUCTION = 'feature_introduction',

  // AI Coach Notifications
  AI_WEEKLY_INSIGHTS = 'ai_weekly_insights',
  AI_RELATIONSHIP_MILESTONE = 'ai_relationship_milestone',
  AI_PERSONALIZED_TIP = 'ai_personalized_tip',

  // System Notifications
  ACCOUNT_SECURITY = 'account_security',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  FEATURE_UPDATE = 'feature_update',
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
    types: {
      [NotificationType.SOS_CONFIRMATION]: boolean;
      [NotificationType.SOS_REMINDER]: boolean;
      [NotificationType.SOS_FOLLOWUP]: boolean;
      [NotificationType.JOURNAL_REMINDER]: boolean;
      [NotificationType.JOURNAL_STREAK_CELEBRATION]: boolean;
      [NotificationType.JOURNAL_WEEKLY_INSIGHTS]: boolean;
      [NotificationType.COMMUNITY_POST_LIKE]: boolean;
      [NotificationType.COMMUNITY_POST_COMMENT]: boolean;
      [NotificationType.COMMUNITY_MENTION]: boolean;
      [NotificationType.COMMUNITY_WEEKLY_DIGEST]: boolean;
      [NotificationType.SUBSCRIPTION_CONFIRMATION]: boolean;
      [NotificationType.SUBSCRIPTION_CANCELLED]: boolean;
      [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]: boolean;
      [NotificationType.SUBSCRIPTION_RENEWAL_REMINDER]: boolean;
      [NotificationType.WELCOME_EMAIL]: boolean;
      [NotificationType.ONBOARDING_INCOMPLETE]: boolean;
      [NotificationType.FEATURE_INTRODUCTION]: boolean;
      [NotificationType.AI_WEEKLY_INSIGHTS]: boolean;
      [NotificationType.AI_RELATIONSHIP_MILESTONE]: boolean;
      [NotificationType.AI_PERSONALIZED_TIP]: boolean;
      [NotificationType.ACCOUNT_SECURITY]: boolean;
      [NotificationType.SYSTEM_MAINTENANCE]: boolean;
      [NotificationType.FEATURE_UPDATE]: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      [NotificationType.SOS_REMINDER]: boolean;
      [NotificationType.COMMUNITY_MENTION]: boolean;
      [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    showBadges: boolean;
  };
}

export const defaultNotificationPreferences: Omit<NotificationPreferences, 'userId'> = {
  email: {
    enabled: true,
    frequency: 'immediate',
    types: {
      [NotificationType.SOS_CONFIRMATION]: true,
      [NotificationType.SOS_REMINDER]: true,
      [NotificationType.SOS_FOLLOWUP]: true,
      [NotificationType.JOURNAL_REMINDER]: true,
      [NotificationType.JOURNAL_STREAK_CELEBRATION]: true,
      [NotificationType.JOURNAL_WEEKLY_INSIGHTS]: true,
      [NotificationType.COMMUNITY_POST_LIKE]: false, // Disabled by default to avoid spam
      [NotificationType.COMMUNITY_POST_COMMENT]: true,
      [NotificationType.COMMUNITY_MENTION]: true,
      [NotificationType.COMMUNITY_WEEKLY_DIGEST]: true,
      [NotificationType.SUBSCRIPTION_CONFIRMATION]: true,
      [NotificationType.SUBSCRIPTION_CANCELLED]: true,
      [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]: true,
      [NotificationType.SUBSCRIPTION_RENEWAL_REMINDER]: true,
      [NotificationType.WELCOME_EMAIL]: true,
      [NotificationType.ONBOARDING_INCOMPLETE]: true,
      [NotificationType.FEATURE_INTRODUCTION]: false, // Let users opt-in
      [NotificationType.AI_WEEKLY_INSIGHTS]: true,
      [NotificationType.AI_RELATIONSHIP_MILESTONE]: true,
      [NotificationType.AI_PERSONALIZED_TIP]: false, // Let users opt-in
      [NotificationType.ACCOUNT_SECURITY]: true,
      [NotificationType.SYSTEM_MAINTENANCE]: true,
      [NotificationType.FEATURE_UPDATE]: false, // Let users opt-in
    },
  },
  push: {
    enabled: false, // Users must opt-in to push notifications
    types: {
      [NotificationType.SOS_REMINDER]: true,
      [NotificationType.COMMUNITY_MENTION]: true,
      [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]: true,
    },
  },
  inApp: {
    enabled: true,
    showBadges: true,
  },
};

export interface ScheduledNotification {
  id: string;
  userId: string;
  type: NotificationType;
  scheduledFor: Date;
  data: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Frequency rule types
export interface BaseFrequencyRule {
  maxPerDay?: number;
  maxPerWeek?: number;
  maxPerEvent?: number;
  urgent?: boolean;
  immediate?: boolean;
}

export interface HourlyFrequencyRule extends BaseFrequencyRule {
  minIntervalHours: number;
  preferredTimes?: string[];
}

export interface DailyFrequencyRule extends BaseFrequencyRule {
  minIntervalDays: number;
  preferredDay?: string;
  preferredTime?: string;
  preferredTimes?: string[];
}

export interface ImmediateFrequencyRule extends BaseFrequencyRule {
  immediate: true;
  maxPerEvent?: number;
}

export type FrequencyRule = HourlyFrequencyRule | DailyFrequencyRule | ImmediateFrequencyRule;

export interface NotificationTemplate {
  type: NotificationType;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
  category: 'transactional' | 'promotional' | 'notification';
  priority: 'low' | 'normal' | 'high' | 'critical';
}

// Notification frequency rules
export const NotificationFrequencyRules: Record<NotificationType, FrequencyRule> = {
  // SOS notifications are typically immediate, no throttling needed
  [NotificationType.SOS_CONFIRMATION]: {
    maxPerDay: 10, // Allow multiple sessions per day
    minIntervalHours: 0,
  },
  [NotificationType.SOS_REMINDER]: {
    maxPerDay: 5,
    minIntervalHours: 1,
  },
  [NotificationType.SOS_FOLLOWUP]: {
    maxPerDay: 2,
    minIntervalHours: 4,
  },
  // Other immediate notifications
  [NotificationType.SUBSCRIPTION_CONFIRMATION]: {
    maxPerDay: 3,
    minIntervalHours: 0,
  },
  [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]: {
    maxPerDay: 2,
    minIntervalHours: 6,
  },
  [NotificationType.SUBSCRIPTION_CANCELLED]: {
    maxPerEvent: 1,
    immediate: true,
  },
  [NotificationType.SUBSCRIPTION_RENEWAL_REMINDER]: {
    maxPerWeek: 2,
    minIntervalDays: 3,
    preferredTimes: ['10:00', '15:00'],
  },
  // Welcome & Onboarding
  [NotificationType.WELCOME_EMAIL]: {
    maxPerEvent: 1,
    immediate: true,
  },
  [NotificationType.ONBOARDING_INCOMPLETE]: {
    maxPerWeek: 2,
    minIntervalDays: 2,
    preferredTimes: ['10:00'],
  },
  [NotificationType.FEATURE_INTRODUCTION]: {
    maxPerWeek: 3,
    minIntervalDays: 2,
    preferredTimes: ['14:00'],
  },
  // AI Coach Notifications
  [NotificationType.AI_RELATIONSHIP_MILESTONE]: {
    maxPerWeek: 2,
    minIntervalDays: 2,
    preferredTimes: ['11:00'],
  },
  [NotificationType.AI_PERSONALIZED_TIP]: {
    maxPerDay: 1,
    minIntervalHours: 24,
    preferredTimes: ['09:00', '15:00'],
  },
  // System Notifications
  [NotificationType.ACCOUNT_SECURITY]: {
    maxPerDay: 3,
    minIntervalHours: 4,
    urgent: true,
  },
  [NotificationType.SYSTEM_MAINTENANCE]: {
    maxPerWeek: 2,
    minIntervalDays: 1,
    urgent: true,
  },
  [NotificationType.COMMUNITY_POST_LIKE]: {
    maxPerDay: 10,
    minIntervalHours: 1,
  },
  [NotificationType.COMMUNITY_POST_COMMENT]: {
    maxPerDay: 5,
    minIntervalHours: 2,
  },
  [NotificationType.COMMUNITY_MENTION]: {
    maxPerDay: 10,
    minIntervalHours: 0,
  },
  [NotificationType.JOURNAL_STREAK_CELEBRATION]: {
    maxPerDay: 1,
    minIntervalHours: 24,
  },
  [NotificationType.FEATURE_UPDATE]: {
    maxPerWeek: 1,
    minIntervalDays: 7,
    preferredDay: 'tuesday',
    preferredTime: '10:00',
  },
  // Scheduled notifications
  [NotificationType.JOURNAL_REMINDER]: {
    maxPerDay: 1,
    minIntervalHours: 24,
    preferredTimes: ['09:00', '19:00'], // 9 AM or 7 PM
  },
  [NotificationType.JOURNAL_WEEKLY_INSIGHTS]: {
    maxPerWeek: 1,
    minIntervalDays: 7,
    preferredDay: 'sunday',
    preferredTime: '11:00',
  },
  [NotificationType.AI_WEEKLY_INSIGHTS]: {
    maxPerWeek: 1,
    minIntervalDays: 7,
    preferredDay: 'sunday',
    preferredTime: '10:00',
  },
  [NotificationType.COMMUNITY_WEEKLY_DIGEST]: {
    maxPerWeek: 1,
    minIntervalDays: 7,
    preferredDay: 'monday',
    preferredTime: '09:00',
  },
};

export class NotificationScheduler {
  /**
   * Check if user can receive a specific notification type based on their preferences and frequency rules
   */
  static canSendNotification(
    type: NotificationType,
    userPreferences: NotificationPreferences,
    lastSentTimes: Record<NotificationType, Date | null>
  ): boolean {
    // Check if user has enabled this notification type
    if (!userPreferences.email.enabled || !userPreferences.email.types[type]) {
      return false;
    }

    // Check frequency rules
    const rules = NotificationFrequencyRules[type];
    if (!rules) return true;

    const lastSent = lastSentTimes[type];
    if (!lastSent) return true;

    const now = new Date();
    const timeDiff = now.getTime() - lastSent.getTime();

    if ('minIntervalHours' in rules && rules.minIntervalHours) {
      const minInterval = rules.minIntervalHours * 60 * 60 * 1000;
      if (timeDiff < minInterval) return false;
    }

    if ('minIntervalDays' in rules && rules.minIntervalDays) {
      const minInterval = rules.minIntervalDays * 24 * 60 * 60 * 1000;
      if (timeDiff < minInterval) return false;
    }

    return true;
  }

  /**
   * Get the optimal time to send a notification based on user preferences and rules
   */
  static getOptimalSendTime(type: NotificationType, userTimezone = 'UTC'): Date {
    const rules = NotificationFrequencyRules[type];
    const now = new Date();

    if (!rules || !('preferredTimes' in rules) || !rules.preferredTimes) {
      return now;
    }

    // For now, return immediate send time
    // In production, this would calculate based on user timezone and preferred times
    return now;
  }
}