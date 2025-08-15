/**
 * Email Service for Saga AI Coach
 * Supports multiple email providers with fallback
 */

import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface PaymentEmailData {
  name: string;
  email: string;
  amount: number;
  planName: string;
  transactionId: string;
}

export interface SOSBookingEmailData {
  name: string;
  email: string;
  sessionTime: string;
  meetingLink: string;
  confirmationId: string;
}

class EmailService {
  private resend: Resend | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        this.resend = new Resend(apiKey);
        this.isConfigured = true;
        console.log('Email service initialized with Resend');
      } else {
        console.warn('Email service not configured: Missing RESEND_API_KEY');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  private getFromAddress(): string {
    return process.env.EMAIL_FROM || 'noreply@sagaaicoach.com';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      console.error('Email service not configured, skipping email send');
      return false;
    }

    try {
      const result = await this.resend.emails.send({
        from: options.from || this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      });

      console.log('Email sent successfully:', result.data?.id);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Saga AI Coach</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f43f5e, #ec4899); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .cta-button { background: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Saga AI Coach!</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name},</h2>
              <p>Thank you for joining Saga AI Coach! We're excited to help you on your relationship journey.</p>
              
              <p>Your account has been successfully created. Here's what you can do next:</p>
              
              <ul>
                <li><strong>Complete your profile:</strong> Tell us about your relationship goals</li>
                <li><strong>Start chatting with Sage:</strong> Your AI relationship coach is ready to help</li>
                <li><strong>Explore the community:</strong> Connect with others on similar journeys</li>
                <li><strong>Try journaling:</strong> Reflect and get AI-powered insights</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sagaaicoach.com'}/onboarding" class="cta-button">
                  Complete Your Setup
                </a>
              </div>
              
              <p>If you have any questions, feel free to reach out to our support team at support@sagaaicoach.com</p>
              
              <p>Welcome aboard!<br>The Saga AI Coach Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Saga AI Coach. All rights reserved.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: 'Welcome to Saga AI Coach - Your Relationship Journey Begins!',
      html,
    });
  }

  async sendPaymentSuccessEmail(data: PaymentEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation - Saga AI Coach</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .payment-details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name},</h2>
              <p>Thank you for upgrading to the <strong>${data.planName}</strong> plan! Your payment has been successfully processed.</p>
              
              <div class="payment-details">
                <h3>Payment Details:</h3>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
                <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Your new features are now active! You can now access:</p>
              <ul>
                <li>Unlimited AI chat sessions</li>
                <li>Advanced journal analysis</li>
                <li>SOS emergency coaching sessions</li>
                <li>Full community access</li>
                <li>Priority support</li>
              </ul>
              
              <p>Start exploring your enhanced experience at <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sagaaicoach.com'}">sagaaicoach.com</a></p>
              
              <p>Questions? Contact us at support@sagaaicoach.com</p>
              
              <p>Thank you for choosing Saga AI Coach!</p>
            </div>
            <div class="footer">
              <p>© 2024 Saga AI Coach. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: `Payment Confirmed - Welcome to ${data.planName}!`,
      html,
    });
  }

  async sendSOSBookingConfirmation(data: SOSBookingEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SOS Session Confirmed - Saga AI Coach</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .session-details { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .cta-button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SOS Session Confirmed</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name},</h2>
              <p>Your SOS emergency coaching session has been confirmed. We're here to support you during this challenging time.</p>
              
              <div class="session-details">
                <h3>Session Details:</h3>
                <p><strong>Date & Time:</strong> ${data.sessionTime}</p>
                <p><strong>Duration:</strong> 50 minutes</p>
                <p><strong>Confirmation ID:</strong> ${data.confirmationId}</p>
                <p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.meetingLink}" class="cta-button">
                  Join Session
                </a>
              </div>
              
              <h3>Before Your Session:</h3>
              <ul>
                <li>Find a quiet, private space where you can speak openly</li>
                <li>Have a glass of water nearby</li>
                <li>Prepare any specific topics or questions you'd like to discuss</li>
                <li>Test your camera and microphone 5 minutes before the session</li>
              </ul>
              
              <h3>Need to Reschedule?</h3>
              <p>If you need to reschedule, please contact us at least 2 hours before your session at support@sagaaicoach.com</p>
              
              <p><strong>Crisis Resources:</strong> If you're experiencing a mental health emergency, please contact your local emergency services or crisis hotline immediately.</p>
              
              <p>We're here for you!</p>
            </div>
            <div class="footer">
              <p>© 2024 Saga AI Coach. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: 'SOS Session Confirmed - We\'re Here for You',
      html,
    });
  }

  async sendPaymentFailedEmail(data: PaymentEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Issue - Saga AI Coach</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .cta-button { background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Issue</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name},</h2>
              <p>We encountered an issue processing your payment for the ${data.planName} plan.</p>
              
              <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
              
              <p>This could be due to:</p>
              <ul>
                <li>Insufficient funds</li>
                <li>Expired payment method</li>
                <li>Bank security restrictions</li>
                <li>Technical issue</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sagaaicoach.com'}/profile" class="cta-button">
                  Update Payment Method
                </a>
              </div>
              
              <p>Don't worry - your account remains active and you can update your payment method anytime.</p>
              
              <p>If you continue to experience issues, please contact our support team at support@sagaaicoach.com</p>
            </div>
            <div class="footer">
              <p>© 2024 Saga AI Coach. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: 'Payment Issue - Action Required',
      html,
    });
  }

  // Additional methods to bridge compatibility with new email service
  async sendSOSConfirmation(data: SOSBookingEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SOS Session Confirmed - Saga AI Coach</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .session-details { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .cta-button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SOS Session Confirmed</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name},</h2>
              <p>Your SOS emergency coaching session has been confirmed. We're here to support you during this challenging time.</p>
              
              <div class="session-details">
                <h3>Session Details:</h3>
                <p><strong>Date & Time:</strong> ${data.sessionTime}</p>
                <p><strong>Duration:</strong> 60 minutes</p>
                <p><strong>Confirmation ID:</strong> ${data.confirmationId}</p>
                <p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.meetingLink}" class="cta-button">
                  Join Session
                </a>
              </div>
              
              <h3>Before Your Session:</h3>
              <ul>
                <li>Find a quiet, private space where you can speak openly</li>
                <li>Have a glass of water nearby</li>
                <li>Prepare any specific topics or questions you'd like to discuss</li>
                <li>Test your camera and microphone 5 minutes before the session</li>
              </ul>
              
              <h3>Need to Reschedule?</h3>
              <p>If you need to reschedule, please contact us at least 2 hours before your session at support@sagaaicoach.com</p>
              
              <p><strong>Crisis Resources:</strong> If you're experiencing a mental health emergency, please contact your local emergency services or crisis hotline immediately.</p>
              
              <p>We're here for you!</p>
            </div>
            <div class="footer">
              <p>© 2024 Saga AI Coach. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: 'SOS Session Confirmed - We\'re Here for You',
      html,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types for use in other files
export { EmailService };

// Compatibility exports for new email service types
export type { SOSSessionData, JournalReminderData, CommunityNotificationData, SubscriptionData } from '@/lib/email/email-service';