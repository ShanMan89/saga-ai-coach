
import type { Firestore } from 'firebase/firestore';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, updateDoc, getDoc, limit, where, deleteDoc, increment, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import type { Post, Comment, UserProfile, JournalEntry, Appointment, DailySchedule, AudioTip, Message, AnalyzeJournalEntryOutput } from '@/lib/types';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import type { FirebaseApp } from 'firebase/app';
import { addDays, startOfDay } from 'date-fns';


// A helper function to safely convert Firestore Timestamps to JS Dates
const toDate = (timestamp: any): Date | undefined => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
      return timestamp;
  }
  return undefined;
};


// --- User Profile Functions ---
export const getUserProfile = async (firestore: Firestore, userId: string): Promise<UserProfile | null> => {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const data = userDoc.data();
        return {
            ...data,
            uid: userId,
            createdAt: toDate(data.createdAt) || new Date(),
            lastMessageDate: toDate(data.lastMessageDate),
        } as UserProfile;
    }
    return null;
}

export const updateUserProfile = async (firestore: Firestore, userId: string, data: Partial<UserProfile>) => {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, data);
};

export const getUsers = async (firestore: Firestore): Promise<UserProfile[]> => {
    const usersCollection = collection(firestore, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        uid: doc.id,
        createdAt: toDate(data.createdAt) || new Date(),
        lastMessageDate: toDate(data.lastMessageDate),
      } as UserProfile
    });
}


// --- Chat History Functions ---
export const saveChatMessage = async (firestore: Firestore, userId: string, message: Message) => {
    const chatHistoryRef = collection(firestore, `users/${userId}/chatHistory`);
    await addDoc(chatHistoryRef, {
        ...message,
        timestamp: serverTimestamp()
    });

    if (message.role === 'user') {
      const userDocRef = doc(firestore, 'users', userId);
      await setDoc(userDocRef, {
          messageCount: increment(1),
          lastMessageDate: serverTimestamp()
      }, { merge: true });
    }
}

export const getChatHistory = async (firestore: Firestore, userId: string, limitCount = 20): Promise<Message[]> => {
    const chatHistoryRef = collection(firestore, `users/${userId}/chatHistory`);
    const q = query(chatHistoryRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            role: data.role,
            content: data.content,
            suggestions: data.suggestions,
        } as Message;
    }).reverse();
    return messages;
}

// --- Journal Functions ---
export const saveJournalEntry = async (firestore: Firestore, userId: string, entryData: { content: string, analysis?: AnalyzeJournalEntryOutput | null }): Promise<string> => {
    const entriesRef = collection(firestore, 'journalEntries');
    const docRef = await addDoc(entriesRef, {
        userId: userId,
        content: entryData.content,
        analysis: entryData.analysis,
        date: serverTimestamp()
    });
    return docRef.id;
}

export const getJournalEntries = async (firestore: Firestore, userId: string, limitCount = 50): Promise<JournalEntry[]> => {
    const entriesRef = collection(firestore, 'journalEntries');
    const q = query(entriesRef, where('userId', '==', userId), orderBy('date', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: toDate(data.date) || new Date(),
        } as JournalEntry;
    });
}

// --- Community Feed Functions ---
export const getCommunityPosts = async (firestore: Firestore, options: { limit?: number } = {}): Promise<Post[]> => {
    const communityPostsCollection = collection(firestore, 'community-posts');
    const q = options.limit
        ? query(communityPostsCollection, orderBy('createdAt', 'desc'), limit(options.limit))
        : query(communityPostsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: toDate(data.createdAt) || new Date(),
            comments: data.comments?.map((c: any) => ({ ...c, createdAt: toDate(c.createdAt) || new Date() })) || [],
        } as Post
    });
};

export const createCommunityPost = async (firestore: Firestore, post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'comments'>): Promise<Post> => {
    const communityPostsCollection = collection(firestore, 'community-posts');
    const newPostData = {
        ...post,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        comments: [],
    };
    const docRef = await addDoc(communityPostsCollection, newPostData);
    const newPostDoc = await getDoc(docRef);
    const data = newPostDoc.data();
    return { ...data, id: docRef.id, createdAt: toDate(data?.createdAt) || new Date(), likes: 0, likedBy: [], comments: [] } as Post;
};

export const togglePostLike = async (firestore: Firestore, postId: string, userId: string): Promise<void> => {
  const postRef = doc(firestore, 'community-posts', postId);
  
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) {
    throw new Error('Post not found');
  }
  
  const postData = postDoc.data() as Post;
  const isLiked = postData.likedBy.includes(userId);
  
  await updateDoc(postRef, {
    likes: increment(isLiked ? -1 : 1),
    likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
  });
};

export const addCommentToPost = async (firestore: Firestore, postId: string, commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
  const postRef = doc(firestore, 'community-posts', postId);

  const tempId = doc(collection(firestore, '_')).id; 
  
  const newComment: Comment = {
      ...commentData,
      id: tempId,
      createdAt: new Date(),
  };
  
  const commentForFirestore = {
    ...commentData,
    id: tempId,
    createdAt: serverTimestamp(),
  };

  await updateDoc(postRef, {
    comments: arrayUnion(commentForFirestore)
  });

  return newComment;
};


// --- Admin & Appointment Functions ---
export const getAppointments = async (firestore: Firestore, options: { limit?: number } = {}): Promise<Appointment[]> => {
    const appointmentsCollection = collection(firestore, 'appointments');
    const q = options.limit 
        ? query(appointmentsCollection, orderBy('time', 'desc'), limit(options.limit))
        : query(appointmentsCollection, orderBy('time', 'desc'));
        
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

export const getAppointmentsThisWeek = async (firestore: Firestore): Promise<Appointment[]> => {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const appointmentsCollection = collection(firestore, 'appointments');
  const q = query(appointmentsCollection, where('time', '>=', now.toISOString()), where('time', '<=', oneWeekFromNow.toISOString()));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};


export const updateAppointmentStatus = async (firestore: Firestore, appointmentId: string, status: 'Completed' | 'Cancelled'): Promise<void> => {
    const appointmentRef = doc(firestore, 'appointments', appointmentId);
    await updateDoc(appointmentRef, { status });
};

export const getAdminSchedule = async (firestore: Firestore, date: Date): Promise<DailySchedule | null> => {
    const dateString = date.toISOString().split('T')[0];
    const scheduleRef = doc(firestore, 'adminSchedule', dateString);
    const docSnap = await getDoc(scheduleRef);
    return docSnap.exists() ? docSnap.data() as DailySchedule : null;
};

export const updateAdminSchedule = async (firestore: Firestore, date: Date, time: string, status: 'Available' | 'Unavailable'): Promise<void> => {
    const dateString = date.toISOString().split('T')[0];
    const scheduleRef = doc(firestore, 'adminSchedule', dateString);
    
    await setDoc(scheduleRef, {
        slots: {
            [time]: { status }
        }
    }, { merge: true });
};

// --- New Availability Function ---
export async function getAvailability(firestore: Firestore): Promise<string[]> {
  const availableSlots: string[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < 7; i++) {
    const checkDate = addDays(today, i);
    const dailySchedule = await getAdminSchedule(firestore, checkDate);

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

  // Sort slots chronologically
  availableSlots.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  return availableSlots;
}

// --- Content Management ---
export const getAudioTips = async (firestore: Firestore): Promise<AudioTip[]> => {
    const tipsCollection = collection(firestore, 'audioTips');
    const q = query(tipsCollection, orderBy('dateAdded', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), dateAdded: toDate(doc.data().dateAdded) || new Date() } as AudioTip));
};

export const createAudioTip = async (firestore: Firestore, tip: Omit<AudioTip, 'id' | 'dateAdded'>): Promise<void> => {
    const tipsCollection = collection(firestore, 'audioTips');
    await addDoc(tipsCollection, {
        ...tip,
        dateAdded: serverTimestamp()
    });
};

export const deleteAudioTip = async (firestore: Firestore, app: FirebaseApp, tip: AudioTip): Promise<void> => {
    const tipRef = doc(firestore, 'audioTips', tip.id);
    await deleteDoc(tipRef);
    
    const storage = getStorage(app);
    try {
        const fileRef = ref(storage, tip.url);
        await deleteObject(fileRef);
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn(`File not found for deletion, but continuing to delete Firestore record: ${tip.url}`);
        } else {
            throw error;
        }
    }
};
