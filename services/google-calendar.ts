
'use server';

// This file is now deprecated and its functionality has been replaced by
// a Firestore-based scheduling system.
// It is kept in the project to avoid breaking any legacy import paths during transition,
// but it should not be used for new development. The functions here are non-operational.

export async function getAvailability(): Promise<string[]> {
  console.warn("DEPRECATED: getAvailability from google-calendar.ts was called. Use the firestore service instead.");
  return [];
}

export async function createCalendarEvent(): Promise<{ success: boolean; eventId: string | null, meetLink: string | null }> {
  console.warn("DEPRECATED: createCalendarEvent from google-calendar.ts was called. This function is non-operational.");
  return { success: false, eventId: null, meetLink: null };
}
