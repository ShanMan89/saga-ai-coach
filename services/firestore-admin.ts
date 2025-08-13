
import 'server-only';
import { firestoreAdmin } from '@/lib/firebase-admin';
import type { Post, Comment, UserProfile, JournalEntry, DailySchedule, Appointment } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { add, startOfDay } from 'date-fns';

// --- User Profile Functions ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!firestoreAdmin) {
        console.warn('Firestore Admin not initialized');
        return null;
    }
    const userDocRef = firestoreAdmin.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
        const data = userDoc.data();
        return {
            uid: userId,
            email: data?.email || null,
            name: data?.name || 'User',
            avatar: data?.avatar || '',
            subscriptionTier: data?.subscriptionTier || 'Explorer',
            messageCount: data?.messageCount || 0,
            role: data?.role || 'user',
            lastMessageDate: data?.lastMessageDate?.toDate(),
            stripeCustomerId: data?.stripeCustomerId,
            relationshipStatus: data?.relationshipStatus,
            goals: data?.goals || [],
            focusAreas: data?.focusAreas || []
        } as UserProfile;
    }
    return null;
};

// --- Chat History Functions ---
export const getChatHistory = async (userId: string, limitCount = 20): Promise<{ role: 'user' | 'assistant', content: string }[]> => {
    if (!firestoreAdmin) {
        console.warn('Firestore Admin not initialized');
        return [];
    }
    const chatHistoryRef = firestoreAdmin.collection(`users/${userId}/chatHistory`);
    const snapshot = await chatHistoryRef.orderBy('timestamp', 'desc').limit(limitCount).get();
    return snapshot.docs.map(doc => doc.data() as { role: 'user' | 'assistant', content: string }).reverse();
};

// --- Journal Functions ---
export const getJournalEntries = async (userId: string, limitCount = 50): Promise<JournalEntry[]> => {
    if (!firestoreAdmin) {
        console.warn('Firestore Admin not initialized');
        return [];
    }
    const entriesRef = firestoreAdmin.collection('journalEntries');
    const snapshot = await entriesRef.where('userId', '==', userId).orderBy('date', 'desc').limit(limitCount).get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            date: data.date.toDate()
        } as JournalEntry;
    });
};

// --- Appointment & Schedule Functions ---
export const getAdminSchedule = async (date: Date): Promise<DailySchedule | null> => {
    if (!firestoreAdmin) {
        console.warn('Firestore Admin not initialized');
        return null;
    }
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const scheduleRef = firestoreAdmin.collection('adminSchedule').doc(dateString);
    const docSnap = await scheduleRef.get();
    return docSnap.exists ? docSnap.data() as DailySchedule : null;
};

export const bookAdminSlot = async (slot: string, userProfile: UserProfile): Promise<void> => {
    if (!firestoreAdmin) {
        throw new Error('Firestore Admin not initialized');
    }
    const date = new Date(slot);
    const dateString = date.toISOString().split('T')[0];
    const timeString = date.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
    const scheduleRef = firestoreAdmin.collection('adminSchedule').doc(dateString);

    await firestoreAdmin.runTransaction(async (transaction) => {
        const doc = await transaction.get(scheduleRef);
        const schedule = doc.data() as DailySchedule | undefined;

        if (schedule?.slots[timeString]?.status !== 'Available') {
            throw new Error('This slot is no longer available.');
        }

        transaction.set(scheduleRef, {
            slots: {
                [timeString]: {
                    status: 'Booked',
                    user: userProfile.name,
                    userId: userProfile.uid,
                }
            }
        }, { merge: true });
    });
};

export const bookAppointment = async (slot: string, userProfile: UserProfile): Promise<string> => {
    if (!firestoreAdmin) {
        throw new Error('Firestore Admin not initialized');
    }
    // This function now handles both booking the slot and creating the appointment record
    // to ensure they happen together or not at all.
    await bookAdminSlot(slot, userProfile);

    // Create meeting link for the appointment
    let meetLink: string | undefined;
    try {
        const { meetingService } = await import('@/lib/video/meeting-service');
        const meeting = await meetingService.createMeetingForAppointment(
            `temp-${Date.now()}`, // Temporary ID, will be replaced with actual appointment ID
            slot,
            60, // 60 minute session
            undefined, // Host email - could be admin email
            userProfile.email || undefined,
            userProfile.name
        );
        meetLink = meeting.joinUrl;
    } catch (error) {
        console.error('Failed to create meeting link:', error);
        // Continue with booking even if meeting creation fails
    }

    const appointmentData: Omit<Appointment, 'id'> = {
        userId: userProfile.uid,
        user: userProfile.name,
        email: userProfile.email!,
        time: slot,
        status: 'Upcoming' as const,
        meetLink,
    };
    
    const docRef = await firestoreAdmin.collection('appointments').add(appointmentData);
    
    // Update the meeting with the actual appointment ID if we created one
    if (meetLink) {
        try {
            // In a more sophisticated implementation, we'd store the meeting ID and update it
            console.log('Meeting created for appointment:', docRef.id);
        } catch (error) {
            console.error('Failed to update meeting with appointment ID:', error);
        }
    }
    
    // Schedule reminders for the appointment
    try {
        const { scheduleAppointmentReminders } = await import('@/lib/reminders/reminder-service');
        const appointmentWithId: Appointment = {
            id: docRef.id,
            ...appointmentData,
        };
        scheduleAppointmentReminders(appointmentWithId);
    } catch (error) {
        console.error('Failed to schedule reminders:', error);
        // Continue even if reminder scheduling fails
    }
    
    return docRef.id;
};

export const getAppointmentById = async (appointmentId: string): Promise<Appointment | null> => {
    if (!firestoreAdmin) {
        console.warn('Firestore Admin not initialized');
        return null;
    }
    try {
        const appointmentDoc = await firestoreAdmin.collection('appointments').doc(appointmentId).get();
        if (appointmentDoc.exists) {
            return { id: appointmentDoc.id, ...appointmentDoc.data() } as Appointment;
        }
        return null;
    } catch (error) {
        console.error('Failed to get appointment by ID:', error);
        return null;
    }
};


// --- Community Functions ---
export const createCommunityPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'comments'>): Promise<Post> => {
    if (!firestoreAdmin) {
        throw new Error('Firestore Admin not initialized');
    }
    const newPostRef = firestoreAdmin.collection('community-posts').doc();
    const newPost = {
        ...post,
        createdAt: FieldValue.serverTimestamp(),
        likes: 0,
        likedBy: [],
        comments: [],
    };
    await newPostRef.set(newPost);
    
    const docSnap = await newPostRef.get();
    const data = docSnap.data();

    return { 
        ...data,
        id: newPostRef.id,
        createdAt: data?.createdAt.toDate() 
    } as Post;
};

export const togglePostLike = async (postId: string, userId: string) => {
    if (!firestoreAdmin) {
        throw new Error('Firestore Admin not initialized');
    }
    const postRef = firestoreAdmin.collection('community-posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        throw new Error("Post not found");
    }

    const postData = postDoc.data() as Post;
    const isLiked = postData.likedBy.includes(userId);
    const increment = isLiked ? FieldValue.increment(-1) : FieldValue.increment(1);
    const likedByUpdate = isLiked ? FieldValue.arrayRemove(userId) : FieldValue.arrayUnion(userId);

    await postRef.update({
        likes: increment,
        likedBy: likedByUpdate,
    });
};

export const addCommentToPost = async (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
    if (!firestoreAdmin) {
        throw new Error('Firestore Admin not initialized');
    }
    const postRef = firestoreAdmin.collection('community-posts').doc(postId);
    const newCommentId = firestoreAdmin.collection('community-posts').doc().id;

    const newCommentForFirestore = {
        ...comment,
        id: newCommentId,
        createdAt: FieldValue.serverTimestamp(),
    };

    await postRef.update({
        comments: FieldValue.arrayUnion(newCommentForFirestore),
    });

    return { 
        ...comment,
        id: newCommentId,
        createdAt: new Date(), // Return with a client-side date for immediate use
    };
};

// --- Schedule/Availability Functions ---
export const getAvailability = async (): Promise<string[]> => {
  if (!firestoreAdmin) {
    console.warn('Firestore Admin not initialized');
    return [];
  }
  const availableSlots: string[] = [];
  const today = startOfDay(new Date());
  
  for (let i = 0; i < 7; i++) {
    const checkDate = add(today, { days: i });
    const dateString = checkDate.toISOString().split('T')[0];
    const scheduleRef = firestoreAdmin.collection('adminSchedule').doc(dateString);
    const scheduleDoc = await scheduleRef.get();
    
    if (scheduleDoc.exists) {
      const dailySchedule = scheduleDoc.data() as DailySchedule;
      if (dailySchedule?.slots) {
        for (const time in dailySchedule.slots) {
          const slotData = dailySchedule.slots[time];
          if (slotData.status === 'Available') {
            const [hour, minute] = time.split(':');
            const slotDate = new Date(checkDate);
            slotDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
            if (slotDate > new Date()) { // Ensure the slot is in the future
              availableSlots.push(slotDate.toISOString());
            }
          }
        }
      }
    }
  }
  
  return availableSlots;
};
