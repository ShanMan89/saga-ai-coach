/**
 * Video Meeting Service for SOS Sessions
 * Handles integration with video conferencing platforms
 */

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
      // In production, this would use Google Calendar API
      // For now, we'll generate a placeholder Google Meet link
      const meetingId = this.generateMeetingId();
      
      // TODO: Implement actual Google Calendar API integration
      // const calendar = google.calendar({ version: 'v3', auth });
      // const event = await calendar.events.insert({...});
      
      return {
        meetingId,
        joinUrl: `https://meet.google.com/${meetingId}`,
        password: undefined, // Google Meet doesn't use passwords
      };
    } catch (error) {
      console.error('Failed to create Google Meet:', error);
      throw new Error('Failed to create Google Meet link');
    }
  }

  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      // TODO: Implement Google Calendar event deletion
      console.log('Would delete Google Meet:', meetingId);
      return true;
    } catch (error) {
      console.error('Failed to delete Google Meet:', error);
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

// Singleton instance
export const meetingService = new MeetingService();

// Provider factory functions
export const createGoogleMeetProvider = (apiKey: string, serviceAccountEmail: string) => 
  new GoogleMeetProvider(apiKey, serviceAccountEmail);

export const createZoomProvider = (apiKey: string, apiSecret: string, accountId: string) => 
  new ZoomProvider(apiKey, apiSecret, accountId);

export const createSimpleMeetProvider = (baseUrl?: string) => 
  new SimpleMeetProvider(baseUrl);

// Environment-based provider setup
export const setupMeetingProvider = () => {
  const provider = process.env.VIDEO_PROVIDER || 'simple';
  
  switch (provider) {
    case 'google':
      if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        meetingService.setProvider(
          createGoogleMeetProvider(
            process.env.GOOGLE_API_KEY,
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
          )
        );
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
      }
      break;
    
    case 'simple':
    default:
      meetingService.setProvider(
        createSimpleMeetProvider(process.env.MEET_BASE_URL)
      );
      break;
  }
};