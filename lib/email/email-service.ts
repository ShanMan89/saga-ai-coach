/**
 * Email Service for Saga AI Coach
 * Handles all email notifications and communications
 */

export interface EmailConfig {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface NotificationData {
  userEmail: string;
  userName: string;
  userId: string;
}

export interface SOSSessionData extends NotificationData {
  sessionTime: string;
  sessionDate: string;
  meetingLink?: string;
}

export interface JournalReminderData extends NotificationData {
  lastEntryDate?: string;
  streakCount?: number;
}

export interface CommunityNotificationData extends NotificationData {
  postTitle: string;
  postAuthor: string;
  postUrl: string;
  notificationType: 'like' | 'comment' | 'mention';
}

export interface SubscriptionData extends NotificationData {
  planName: string;
  amount: number;
  nextBillingDate: string;
  subscriptionStatus: 'active' | 'cancelled' | 'past_due';
}

export class EmailService {
  private static instance: EmailService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sagaaicoach.com';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send SOS Session confirmation email
   */
  async sendSOSConfirmation(data: SOSSessionData): Promise<boolean> {
    const html = this.generateSOSConfirmationHTML(data);
    const text = this.generateSOSConfirmationText(data);

    const config: EmailConfig = {
      to: data.userEmail,
      subject: `SOS Session Confirmed - ${data.sessionDate} at ${data.sessionTime}`,
      html,
      text
    };

    return this.sendEmail(config);
  }

  /**
   * Send journal reminder email
   */
  async sendJournalReminder(data: JournalReminderData): Promise<boolean> {
    const html = this.generateJournalReminderHTML(data);
    const text = this.generateJournalReminderText(data);

    const config: EmailConfig = {
      to: data.userEmail,
      subject: this.getJournalReminderSubject(data),
      html,
      text
    };

    return this.sendEmail(config);
  }

  /**
   * Send community notification
   */
  async sendCommunityNotification(data: CommunityNotificationData): Promise<boolean> {
    const html = this.generateCommunityNotificationHTML(data);
    const text = this.generateCommunityNotificationText(data);

    const config: EmailConfig = {
      to: data.userEmail,
      subject: this.getCommunityNotificationSubject(data),
      html,
      text
    };

    return this.sendEmail(config);
  }

  /**
   * Send subscription update email
   */
  async sendSubscriptionUpdate(data: SubscriptionData): Promise<boolean> {
    const html = this.generateSubscriptionUpdateHTML(data);
    const text = this.generateSubscriptionUpdateText(data);

    const config: EmailConfig = {
      to: data.userEmail,
      subject: this.getSubscriptionUpdateSubject(data),
      html,
      text
    };

    return this.sendEmail(config);
  }

  /**
   * Core email sending method
   * Implemented with Resend email service
   */
  private async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      // Check if email service is configured
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn('Email service not configured: Missing RESEND_API_KEY');
        console.log('📧 Email would be sent:', {
          to: config.to,
          subject: config.subject,
          preview: config.text?.substring(0, 100) + '...'
        });
        return false;
      }

      // Dynamic import of Resend to avoid issues if not installed
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);

      const result = await resend.emails.send({
        from: config.from || process.env.EMAIL_FROM || 'noreply@sagaaicoach.com',
        to: config.to,
        subject: config.subject,
        html: config.html,
        text: config.text,
      });

      console.log('✅ Email sent successfully:', result.data?.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Fallback: log the email for development
      console.log('📧 Email would be sent:', {
        to: config.to,
        subject: config.subject,
        preview: config.text?.substring(0, 100) + '...'
      });
      return false;
    }
  }

  // HTML Template Generators
  private generateSOSConfirmationHTML(data: SOSSessionData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #f43f5e, #ec4899); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SOS Session Confirmed</h1>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi ${data.userName},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Your emergency coaching session has been confirmed! Our expert coach will be ready to help you navigate whatever relationship challenge you're facing.
          </p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Session Details</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${data.sessionDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${data.sessionTime}</p>
            ${data.meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #dc2626;">${data.meetingLink}</a></p>` : ''}
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            We're here to support you. Remember, seeking help is a sign of strength, not weakness.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.baseUrl}/sos" style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Session Details</a>
          </div>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    `;
  }

  private generateJournalReminderHTML(data: JournalReminderData): string {
    const motivationalMessages = [
      "Your thoughts matter, and so do you.",
      "Every reflection brings you closer to understanding.",
      "Growth happens one journal entry at a time.",
      "Your relationship journey deserves to be documented.",
      "Take a moment to check in with yourself."
    ];
    
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Time to Reflect 📝</h1>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi ${data.userName},</p>
          
          <p style="font-size: 18px; line-height: 1.6; color: #059669; font-style: italic; text-align: center; margin: 20px 0;">
            "${randomMessage}"
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            It's been a while since your last journal entry. Taking time to reflect on your thoughts, feelings, and relationship experiences can provide valuable insights and help you track your growth.
          </p>
          
          ${data.streakCount ? `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #166534; margin: 0; text-align: center;">
                🔥 Your longest streak was ${data.streakCount} days! Let's start a new one.
              </p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.baseUrl}/journal" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Journaling</a>
          </div>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    `;
  }

  private generateCommunityNotificationHTML(data: CommunityNotificationData): string {
    const actionText = {
      like: 'liked your post',
      comment: 'commented on your post',
      mention: 'mentioned you in a post'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Community Activity</h1>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi ${data.userName},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Great news! ${data.postAuthor} ${actionText[data.notificationType]} in the community.
          </p>
          
          <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin-top: 0;">"${data.postTitle}"</h3>
            <p style="color: #6b7280; margin: 5px 0;">by ${data.postAuthor}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.postUrl}" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Community</a>
          </div>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    `;
  }

  private generateSubscriptionUpdateHTML(data: SubscriptionData): string {
    const statusColors = {
      active: '#10b981',
      cancelled: '#ef4444',
      past_due: '#f59e0b'
    };

    const statusMessages = {
      active: 'Your subscription is active and ready to go!',
      cancelled: 'Your subscription has been cancelled.',
      past_due: 'Your payment is past due. Please update your payment method.'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Update</h1>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi ${data.userName},</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid ${statusColors[data.subscriptionStatus]}; padding: 20px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0;">
              ${statusMessages[data.subscriptionStatus]}
            </p>
          </div>
          
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #334155; margin-top: 0;">Plan Details</h3>
            <p style="margin: 5px 0;"><strong>Plan:</strong> ${data.planName}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${data.amount}/month</p>
            <p style="margin: 5px 0;"><strong>Next Billing:</strong> ${data.nextBillingDate}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${data.subscriptionStatus.replace('_', ' ').toUpperCase()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.baseUrl}/profile" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Subscription</a>
          </div>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    `;
  }

  // Text Template Generators
  private generateSOSConfirmationText(data: SOSSessionData): string {
    return `
SOS Session Confirmed

Hi ${data.userName},

Your emergency coaching session has been confirmed! Our expert coach will be ready to help you navigate whatever relationship challenge you're facing.

Session Details:
- Date: ${data.sessionDate}
- Time: ${data.sessionTime}
${data.meetingLink ? `- Meeting Link: ${data.meetingLink}` : ''}

We're here to support you. Remember, seeking help is a sign of strength, not weakness.

View session details: ${this.baseUrl}/sos

Best regards,
The Saga AI Coach Team
    `.trim();
  }

  private generateJournalReminderText(data: JournalReminderData): string {
    return `
Time to Reflect

Hi ${data.userName},

It's been a while since your last journal entry. Taking time to reflect on your thoughts, feelings, and relationship experiences can provide valuable insights and help you track your growth.

${data.streakCount ? `Your longest streak was ${data.streakCount} days! Let's start a new one.` : ''}

Start journaling: ${this.baseUrl}/journal

Best regards,
The Saga AI Coach Team
    `.trim();
  }

  private generateCommunityNotificationText(data: CommunityNotificationData): string {
    const actionText = {
      like: 'liked your post',
      comment: 'commented on your post',
      mention: 'mentioned you in a post'
    };

    return `
Community Activity

Hi ${data.userName},

Great news! ${data.postAuthor} ${actionText[data.notificationType]} in the community.

Post: "${data.postTitle}"
By: ${data.postAuthor}

View in community: ${data.postUrl}

Best regards,
The Saga AI Coach Team
    `.trim();
  }

  private generateSubscriptionUpdateText(data: SubscriptionData): string {
    return `
Subscription Update

Hi ${data.userName},

Here's an update about your Saga AI Coach subscription:

Plan: ${data.planName}
Amount: $${data.amount}/month
Next Billing: ${data.nextBillingDate}
Status: ${data.subscriptionStatus.replace('_', ' ').toUpperCase()}

Manage your subscription: ${this.baseUrl}/profile

Best regards,
The Saga AI Coach Team
    `.trim();
  }

  // Helper Methods
  private getJournalReminderSubject(data: JournalReminderData): string {
    const subjects = [
      "Time for reflection 🌟",
      "Your journal is waiting for you",
      "A moment for mindfulness",
      "Ready to explore your thoughts?",
      "Your relationship journey continues"
    ];
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  private getCommunityNotificationSubject(data: CommunityNotificationData): string {
    const actionText = {
      like: 'liked your post',
      comment: 'commented on your post',
      mention: 'mentioned you'
    };
    return `${data.postAuthor} ${actionText[data.notificationType]} 💬`;
  }

  private getSubscriptionUpdateSubject(data: SubscriptionData): string {
    const statusText = {
      active: 'Subscription Confirmed',
      cancelled: 'Subscription Cancelled',
      past_due: 'Payment Required'
    };
    return `${statusText[data.subscriptionStatus]} - Saga AI Coach`;
  }

  private getEmailFooter(): string {
    return `
      <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; margin-top: 20px;">
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 10px 0;">
            <strong>Saga AI Coach</strong><br>
            Transform your relationships with AI-powered guidance
          </p>
          <p style="margin: 10px 0;">
            <a href="${this.baseUrl}/profile" style="color: #6b7280; text-decoration: none;">Manage preferences</a> | 
            <a href="${this.baseUrl}/help" style="color: #6b7280; text-decoration: none;">Help center</a> | 
            <a href="${this.baseUrl}/contact" style="color: #6b7280; text-decoration: none;">Contact support</a>
          </p>
          <p style="margin: 10px 0; font-size: 12px;">
            Made with ❤️ for better relationships
          </p>
        </div>
      </div>
    `;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();