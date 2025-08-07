
import 'server-only';
import { firestoreAdmin } from '@/lib/firebase-admin';
import type { Post, Comment, UserProfile, JournalEntry, DailySchedule, Appointment } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { add, startOfDay } from 'date-fns';

// --- User Profile Functions ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userDocRef = firestoreAdmin.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
        const data = userDoc.data();
        return {
            ...data,
            uid: userId,
            createdAt: data?.createdAt?.toDate(),
            lastMessageDate: data?.lastMessageDate?.toDate(),
        } as UserProfile;
    }
    return null;
};

// --- Chat History Functions ---
export const getChatHistory = async (userId: string, limitCount = 20): Promise<{ role: 'user' | 'assistant', content: string }[]> => {
    const chatHistoryRef = firestoreAdmin.collection(`users/${userId}/chatHistory`);
    const snapshot = await chatHistoryRef.orderBy('timestamp', 'desc').limit(limitCount).get();
    return snapshot.docs.map(doc => doc.data() as { role: 'user' | 'assistant', content: string }).reverse();
};

// --- Journal Functions ---
export const getJournalEntries = async (userId: string, limitCount = 50): Promise<JournalEntry[]> => {
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
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const scheduleRef = firestoreAdmin.collection('adminSchedule').doc(dateString);
    const docSnap = await scheduleRef.get();
    return docSnap.exists() ? docSnap.data() as DailySchedule : null;
};

export const bookAdminSlot = async (slot: string, userProfile: UserProfile): Promise<void> => {
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
    // This function now handles both booking the slot and creating the appointment record
    // to ensure they happen together or not at all.
    await bookAdminSlot(slot, userProfile);

    const appointmentData: Omit<Appointment, 'id'> = {
        userId: userProfile.uid,
        user: userProfile.name,
        email: userProfile.email!,
        time: slot,
        status: 'Upcoming' as const,
    };
    
    const docRef = await firestoreAdmin.collection('appointments').add(appointmentData);
    return docRef.id;
};


// --- Community Functions ---
export const createCommunityPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'comments'>): Promise<Post> => {
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
