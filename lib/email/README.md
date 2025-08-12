# Email Notification System

A comprehensive email notification system for Saga AI Coach that handles all user communications including SOS confirmations, journal reminders, community notifications, and subscription updates.

## Architecture

### Core Components

1. **EmailService** (`email-service.ts`)
   - Handles the actual email sending logic
   - Contains HTML and text email templates
   - Manages email formatting and styling
   - Currently uses placeholder implementation (needs email provider integration)

2. **NotificationManager** (`notification-manager.ts`)
   - Central hub for all notifications
   - Handles user preferences and frequency rules
   - Manages notification scheduling and logging
   - Provides high-level interface for the application

3. **NotificationTypes** (`notification-types.ts`)
   - Defines all notification types and categories
   - Contains user preference structures
   - Includes frequency rules and scheduling logic
   - Provides default notification settings

## Supported Notifications

### Transactional Emails
- **SOS Session Confirmations** - Sent immediately when user books emergency coaching
- **Subscription Updates** - Billing confirmations, cancellations, payment failures

### Engagement Emails
- **Journal Reminders** - Gentle nudges to maintain journaling habits
- **Community Notifications** - Alerts for likes, comments, and mentions
- **Weekly Insights** - AI-powered relationship insights and progress tracking

### System Emails
- **Welcome Series** - Onboarding and feature introduction emails
- **Security Alerts** - Account security and important system notifications
- **Feature Updates** - New feature announcements and updates

## Usage

### Basic Implementation

```typescript
import { sendSOSConfirmation } from '@/lib/email/notification-manager';

// Send SOS confirmation
await sendSOSConfirmation({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  userId: 'user123',
  sessionTime: '2:00 PM',
  sessionDate: 'March 15, 2024',
  meetingLink: 'https://meet.example.com/session123'
});
```

### Advanced Usage with Scheduling

```typescript
import { notificationManager, NotificationType } from '@/lib/email/notification-manager';

// Schedule a journal reminder for tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0); // 9 AM

await notificationManager.scheduleNotification(
  'user123',
  NotificationType.JOURNAL_REMINDER,
  {
    userEmail: 'user@example.com',
    userName: 'John Doe',
    lastEntryDate: '2024-03-10',
    streakCount: 5
  },
  tomorrow
);
```

## Integration Examples

### SOS Session Booking
The system is already integrated with the SOS booking flow:

```typescript
// In ai/flows/book-sos-session.ts
import { sendSOSConfirmation } from '@/lib/email/notification-manager';

// After successful booking
await sendSOSConfirmation({
  userEmail: userProfile.email,
  userName: userProfile.name,
  userId: userProfile.uid,
  sessionTime: sessionDate.toLocaleTimeString(),
  sessionDate: sessionDate.toLocaleDateString(),
});
```

### Journal Entry Reminders
Can be integrated with cron jobs or Firebase Cloud Functions:

```typescript
// Example Firebase Function
import { sendJournalReminder } from '@/lib/email/notification-manager';

export const sendDailyJournalReminders = functions.pubsub
  .schedule('0 9 * * *') // Daily at 9 AM
  .onRun(async (context) => {
    const usersToRemind = await getUsersForJournalReminder();
    
    for (const user of usersToRemind) {
      await sendJournalReminder({
        userEmail: user.email,
        userName: user.name,
        userId: user.uid,
        lastEntryDate: user.lastJournalEntry?.toISOString(),
        streakCount: user.journalStreak
      });
    }
  });
```

## Email Provider Integration

### Current Status
The system currently uses a placeholder implementation that logs emails to the console. To integrate with a real email provider:

### SendGrid Integration
```typescript
// In email-service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

private async sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    await sgMail.send({
      to: config.to,
      from: config.from || 'noreply@sagaaicoach.com',
      subject: config.subject,
      html: config.html,
      text: config.text,
    });
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}
```

### Resend Integration
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

private async sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    await resend.emails.send({
      from: config.from || 'Saga AI Coach <noreply@sagaaicoach.com>',
      to: Array.isArray(config.to) ? config.to : [config.to],
      subject: config.subject,
      html: config.html,
    });
    return true;
  } catch (error) {
    console.error('Resend error:', error);
    return false;
  }
}
```

## User Preferences

Users can control their notification preferences through their profile settings:

```typescript
interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
    types: {
      [NotificationType.SOS_CONFIRMATION]: boolean;
      [NotificationType.JOURNAL_REMINDER]: boolean;
      [NotificationType.COMMUNITY_POST_LIKE]: boolean;
      // ... other types
    };
  };
  push: {
    enabled: boolean;
    types: Record<NotificationType, boolean>;
  };
}
```

## Frequency Rules

The system includes built-in frequency rules to prevent spam:

```typescript
const NotificationFrequencyRules = {
  [NotificationType.JOURNAL_REMINDER]: {
    maxPerDay: 1,
    minIntervalHours: 24,
    preferredTimes: ['09:00', '19:00'],
  },
  [NotificationType.AI_WEEKLY_INSIGHTS]: {
    maxPerWeek: 1,
    minIntervalDays: 7,
    preferredDay: 'sunday',
    preferredTime: '10:00',
  },
};
```

## Future Enhancements

### Database Integration
- Store notification preferences in Firestore
- Track notification history and delivery status
- Implement retry logic for failed deliveries

### Advanced Features
- A/B testing for email templates
- Personalization based on user behavior
- Email analytics and engagement tracking
- Unsubscribe management
- Email template editor for admins

### Real-time Notifications
- Push notifications for mobile apps
- In-app notification system
- WebSocket-based real-time updates

## Environment Variables

Add these environment variables for production:

```env
# Email Provider (choose one)
SENDGRID_API_KEY=your_sendgrid_key
RESEND_API_KEY=your_resend_key
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key

# Email Configuration
NOTIFICATION_FROM_EMAIL=noreply@sagaaicoach.com
NOTIFICATION_FROM_NAME=Saga AI Coach
NEXT_PUBLIC_APP_URL=https://sagaaicoach.com
```

## Testing

The email templates can be tested locally by examining the console output. For production testing:

1. Use email provider's testing/sandbox mode
2. Send to test email addresses
3. Use email testing services like Litmus or Email on Acid
4. Implement automated email testing in CI/CD pipeline

## Monitoring

Consider implementing:
- Email delivery rate monitoring
- Bounce and complaint tracking
- User engagement metrics
- A/B testing results
- Performance monitoring for email sending