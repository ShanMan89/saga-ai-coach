/**
 * Video Meeting Service for SOS Sessions
 * Handles integration with video conferencing platforms
 */

import 'server-only';

export interface MeetingDetails {
  meetingId: string;
  joinUrl: string;
  hostUrl?: string;
  password?: string;
  dialIn?: {
    number: string;
    accessCode: string;
  };
}

export interface CreateMeetingRequest {
  title: string;
  startTime: string; // ISO string
  duration: number; // minutes
  hostEmail?: string;
  attendeeEmail?: string;
  attendeeName?: string;
}

export abstract class VideoMeetingProvider {
  abstract createMeeting(request: CreateMeetingRequest): Promise<MeetingDetails>;
  abstract deleteMeeting(meetingId: string): Promise<boolean>;
}

/**
 * Google Meet Provider
 * Uses Google Calendar API to create Meet links
 */
export class GoogleMeetProvider extends VideoMeetingProvider {
  private apiKey: string;
  private serviceAccountEmail: string;

  constructor(apiKey: string, serviceAccountEmail: string) {
    super();
    this.apiKey = apiKey;
    this.serviceAccountEmail = serviceAccountEmail;
  }

  async createMeeting(request: CreateMeetingRequest): Promise<MeetingDetails> {
    try {
      // Check if we have the required environment variables for Google Calendar API
      const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;
      const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
      
      if (!privateKey || !clientEmail) {
        console.warn('Google Calendar credentials not configured, using placeholder link');
        const meetingId = this.generateMeetingId();
        return {
          meetingId,
          joinUrl: `https://meet.google.com/${meetingId}`,
          password: undefined,
        };
      }

      // Dynamic import to avoid issues if googleapis isn't available
      const { google } = await import('googleapis');
      
      // Set up authentication
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      const calendar = google.calendar({ version: 'v3', auth });
      
      // Create calendar event with Google Meet
      const startTime = new Date(request.startTime);
      const endTime = new Date(startTime.getTime() + (request.duration * 60 * 1000));

      const event = {
        summary: request.title,
        description: `SOS Coaching Session\n\nCoach: ${request.hostEmail || 'Saga AI Coach'}\nParticipant: ${request.attendeeName || 'Client'}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: [
          ...(request.hostEmail ? [{ email: request.hostEmail }] : []),
          ...(request.attendeeEmail ? [{ email: request.attendeeEmail, displayName: request.attendeeName }] : []),
        ],
        conferenceData: {
          createRequest: {
            requestId: `sos-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 15 }, // 15 minutes before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all', // Send invites to all attendees
        requestBody: event,
      });

      const createdEvent = response.data;
      const meetingId = createdEvent.id || this.generateMeetingId();
      const joinUrl = createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || 
                     createdEvent.hangoutLink || 
                     `https://meet.google.com/${this.generateMeetingId()}`;

      return {
        meetingId,
        joinUrl,
        password: undefined, // Google Meet doesn't use passwords
      };
    } catch (error) {
      console.error('Failed to create Google Meet:', error);
      
      // Fallback to placeholder link if API fails
      const meetingId = this.generateMeetingId();
      return {
        meetingId,
        joinUrl: `https://meet.google.com/${meetingId}`,
        password: undefined,
      };
    }
  }

  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      // Check if we have the required environment variables for Google Calendar API
      const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;
      const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
      
      if (!privateKey || !clientEmail) {
        console.warn('Google Calendar credentials not configured, cannot delete calendar event');
        return true; // Return true to not block the cancellation process
      }

      // Dynamic import to avoid issues if googleapis isn't available
      const { google } = await import('googleapis');
      
      // Set up authentication
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      const calendar = google.calendar({ version: 'v3', auth });
      
      // Delete the calendar event
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: meetingId,
        sendUpdates: 'all', // Notify all attendees about cancellation
      });

      console.log('Successfully deleted Google Calendar event:', meetingId);
      return true;
    } catch (error: any) {
      console.error('Failed to delete Google Meet:', error);
      
      // If the event doesn't exist, consider it successfully deleted
      if (error?.status === 404 || error?.code === 404) {
        console.log('Calendar event not found, considering deletion successful:', meetingId);
        return true;
      }
      
      return false;
    }
  }

  private generateMeetingId(): string {
    // Generate a Google Meet-like ID (xxx-xxxx-xxx)
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${part1}-${part2}-${part3}`;
  }
}

/**
 * Zoom Provider
 * Uses Zoom API to create meetings
 */
export class ZoomProvider extends VideoMeetingProvider {
  private apiKey: string;
  private apiSecret: string;
  private accountId: string;

  constructor(apiKey: string, apiSecret: string, accountId: string) {
    super();
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.accountId = accountId;
  }

  async createMeeting(request: CreateMeetingRequest): Promise<MeetingDetails> {
    try {
      // In production, this would use Zoom API
      // For now, we'll generate a placeholder Zoom link
      const meetingId = this.generateMeetingId();
      const password = this.generatePassword();
      
      // TODO: Implement actual Zoom API integration
      // const meeting = await this.zoomApi.createMeeting({...});
      
      return {
        meetingId,
        joinUrl: `https://zoom.us/j/${meetingId}?pwd=${password}`,
        password,
        dialIn: {
          number: '+1-555-123-4567', // Placeholder
          accessCode: meetingId,
        },
      };
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      // TODO: Implement Zoom meeting deletion
      console.log('Would delete Zoom meeting:', meetingId);
      return true;
    } catch (error) {
      console.error('Failed to delete Zoom meeting:', error);
      return false;
    }
  }

  private generateMeetingId(): string {
    // Generate a Zoom-like meeting ID (10-11 digits)
    return Math.floor(Math.random() * 90000000000 + 10000000000).toString();
  }

  private generatePassword(): string {
    // Generate a 6-character password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

/**
 * Simple Meet Provider
 * Creates basic meeting rooms using room codes
 */
export class SimpleMeetProvider extends VideoMeetingProvider {
  private baseUrl: string;

  constructor(baseUrl = 'https://meet.sagaaicoach.com') {
    super();
    this.baseUrl = baseUrl;
  }

  async createMeeting(request: CreateMeetingRequest): Promise<MeetingDetails> {
    const meetingId = this.generateSimpleId();
    
    return {
      meetingId,
      joinUrl: `${this.baseUrl}/room/${meetingId}`,
      password: undefined,
    };
  }

  async deleteMeeting(meetingId: string): Promise<boolean> {
    // For simple rooms, deletion is automatic after session ends
    return true;
  }

  private generateSimpleId(): string {
    // Generate a simple room code
    const words = ['care', 'love', 'hope', 'grow', 'heal', 'bond', 'trust', 'peace'];
    const numbers = Math.floor(Math.random() * 999) + 100;
    const word = words[Math.floor(Math.random() * words.length)];
    return `${word}-${numbers}`;
  }
}

/**
 * Meeting Service Manager
 * Handles video meeting creation and management
 */
export class MeetingService {
  private provider: VideoMeetingProvider;

  constructor(provider?: VideoMeetingProvider) {
    // Default to SimpleMeetProvider if no provider specified
    this.provider = provider || new SimpleMeetProvider();
  }

  async createMeetingForAppointment(
    appointmentId: string,
    startTime: string,
    duration: number = 60,
    hostEmail?: string,
    attendeeEmail?: string,
    attendeeName?: string
  ): Promise<MeetingDetails> {
    const request: CreateMeetingRequest = {
      title: `SOS Coaching Session - ${appointmentId}`,
      startTime,
      duration,
      hostEmail,
      attendeeEmail,
      attendeeName,
    };

    try {
      const meeting = await this.provider.createMeeting(request);
      
      // Log for debugging
      console.log('Meeting created:', {
        appointmentId,
        meetingId: meeting.meetingId,
        joinUrl: meeting.joinUrl,
      });

      return meeting;
    } catch (error) {
      console.error('Failed to create meeting for appointment:', appointmentId, error);
      throw error;
    }
  }

  async cancelMeeting(meetingId: string): Promise<boolean> {
    try {
      return await this.provider.deleteMeeting(meetingId);
    } catch (error) {
      console.error('Failed to cancel meeting:', meetingId, error);
      return false;
    }
  }

  setProvider(provider: VideoMeetingProvider): void {
    this.provider = provider;
  }
}

// Provider factory functions
export const createGoogleMeetProvider = (apiKey: string, serviceAccountEmail: string) => 
  new GoogleMeetProvider(apiKey, serviceAccountEmail);

export const createZoomProvider = (apiKey: string, apiSecret: string, accountId: string) => 
  new ZoomProvider(apiKey, apiSecret, accountId);

export const createSimpleMeetProvider = (baseUrl?: string) => 
  new SimpleMeetProvider(baseUrl);

// Environment-based provider setup
export const setupMeetingProvider = () => {
  const provider = process.env.VIDEO_PROVIDER || 'auto';
  
  switch (provider) {
    case 'google':
      if (process.env.GOOGLE_CALENDAR_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_CLIENT_EMAIL) {
        meetingService.setProvider(
          createGoogleMeetProvider(
            process.env.GOOGLE_API_KEY || '',
            process.env.GOOGLE_CALENDAR_CLIENT_EMAIL
          )
        );
      } else {
        console.warn('Google Meet provider selected but credentials not found, falling back to Simple provider');
        meetingService.setProvider(createSimpleMeetProvider(process.env.MEET_BASE_URL));
      }
      break;
    
    case 'zoom':
      if (process.env.ZOOM_API_KEY && process.env.ZOOM_API_SECRET && process.env.ZOOM_ACCOUNT_ID) {
        meetingService.setProvider(
          createZoomProvider(
            process.env.ZOOM_API_KEY,
            process.env.ZOOM_API_SECRET,
            process.env.ZOOM_ACCOUNT_ID
          )
        );
      } else {
        console.warn('Zoom provider selected but credentials not found, falling back to Simple provider');
        meetingService.setProvider(createSimpleMeetProvider(process.env.MEET_BASE_URL));
      }
      break;
    
    case 'simple':
      meetingService.setProvider(
        createSimpleMeetProvider(process.env.MEET_BASE_URL)
      );
      break;
    
    case 'auto':
    default:
      // Auto-detect best available provider
      if (process.env.GOOGLE_CALENDAR_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_CLIENT_EMAIL) {
        console.log('Auto-selecting Google Meet provider');
        meetingService.setProvider(
          createGoogleMeetProvider(
            process.env.GOOGLE_API_KEY || '',
            process.env.GOOGLE_CALENDAR_CLIENT_EMAIL
          )
        );
      } else if (process.env.ZOOM_API_KEY && process.env.ZOOM_API_SECRET && process.env.ZOOM_ACCOUNT_ID) {
        console.log('Auto-selecting Zoom provider');
        meetingService.setProvider(
          createZoomProvider(
            process.env.ZOOM_API_KEY,
            process.env.ZOOM_API_SECRET,
            process.env.ZOOM_ACCOUNT_ID
          )
        );
      } else {
        console.log('Auto-selecting Simple Meet provider');
        meetingService.setProvider(
          createSimpleMeetProvider(process.env.MEET_BASE_URL)
        );
      }
      break;
  }
};

// Singleton instance
export const meetingService = new MeetingService();

// Initialize the provider when this module is imported
try {
  setupMeetingProvider();
} catch (error) {
  console.error('Failed to setup meeting provider:', error);
  // Fallback to simple provider
  meetingService.setProvider(new SimpleMeetProvider());
}