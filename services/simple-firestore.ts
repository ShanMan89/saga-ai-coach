import type { Firestore } from 'firebase/firestore';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import type { UserProfile, Message, Post, JournalEntry, AnalyzeJournalEntryOutput } from '@/lib/types';
import { globalCache } from '@/lib/simple-cache';

/**
 * Simplified Firestore service for production use
 */

// Cache TTL configurations
const CACHE_TTL = {
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  CHAT_HISTORY: 5 * 60 * 1000,  // 5 minutes
  JOURNAL_ENTRIES: 15 * 60 * 1000, // 15 minutes
  COMMUNITY_POSTS: 2 * 60 * 1000,  // 2 minutes
};

// Common utilities
const toDate = (timestamp: any): Date | undefined => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
      return timestamp;
  }
  return undefined;
};

const createUserProfileFromData = (data: any, uid: string): UserProfile => {
  return {
    uid: uid,
    email: data.email || null,
    name: data.name || 'User',
    avatar: data.avatar || '',
    subscriptionTier: data.subscriptionTier || 'Explorer',
    messageCount: data.messageCount || 0,
    role: data.role || 'user',
    lastMessageDate: toDate(data.lastMessageDate),
    stripeCustomerId: data.stripeCustomerId,
    relationshipStatus: data.relationshipStatus,
    goals: data.goals || [],
    focusAreas: data.focusAreas || []
  } as UserProfile;
};

// --- User Profile Functions ---
export const getUserProfile = async (firestore: Firestore, userId: string): Promise<UserProfile | null> => {
  const cacheKey = `user-profile-${userId}`;
  
  // Check cache first
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const profile = createUserProfileFromData(data, userId);
      
      // Cache the result
      globalCache.set(cacheKey, profile, CACHE_TTL.USER_PROFILE);
      
      return profile;
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (firestore: Firestore, userId: string, data: Partial<UserProfile>) => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, data);
    
    // Invalidate cache
    globalCache.delete(`user-profile-${userId}`);
  } catch (error) {
    throw error;
  }
};

export const getUsers = async (firestore: Firestore): Promise<UserProfile[]> => {
  const cacheKey = 'all-users';
  
  // Check cache first
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const usersCollection = collection(firestore, 'users');
    const snapshot = await getDocs(usersCollection);
    
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return createUserProfileFromData(data, doc.id);
    });
    
    // Cache for 5 minutes
    globalCache.set(cacheKey, users, 5 * 60 * 1000);
    
    return users;
  } catch (error) {
    throw error;
  }
};

// --- Chat History Functions ---
export const saveChatMessage = async (firestore: Firestore, userId: string, message: Message) => {
  try {
    // Add message to chat history
    const chatHistoryRef = collection(firestore, `users/${userId}/chatHistory`);
    await addDoc(chatHistoryRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    
    // Update user message count if it's a user message
    if (message.role === 'user') {
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        messageCount: increment(1),
        lastMessageDate: serverTimestamp()
      });
    }
    
    // Invalidate relevant caches
    globalCache.delete(`user-profile-${userId}`);
    globalCache.delete(`chat-history-${userId}`);
  } catch (error) {
    throw error;
  }
};

export const getChatHistory = async (firestore: Firestore, userId: string, limitCount = 20): Promise<Message[]> => {
  const cacheKey = `chat-history-${userId}`;
  
  // Check cache first
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
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
    
    // Cache the result
    globalCache.set(cacheKey, messages, CACHE_TTL.CHAT_HISTORY);
    
    return messages;
  } catch (error) {
    throw error;
  }
};

// --- Journal Functions ---
export const saveJournalEntry = async (firestore: Firestore, userId: string, entryData: { content: string, analysis?: AnalyzeJournalEntryOutput | null }): Promise<string> => {
  try {
    const entriesRef = collection(firestore, 'journalEntries');
    const docRef = await addDoc(entriesRef, {
      userId: userId,
      content: entryData.content,
      analysis: entryData.analysis,
      date: serverTimestamp()
    });
    
    // Invalidate journal cache
    globalCache.delete(`journal-entries-${userId}`);
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getJournalEntries = async (firestore: Firestore, userId: string, limitCount = 50): Promise<JournalEntry[]> => {
  const cacheKey = `journal-entries-${userId}`;
  
  // Check cache first
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const entriesRef = collection(firestore, 'journalEntries');
    const q = query(entriesRef, where('userId', '==', userId), orderBy('date', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    const entries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: toDate(data.date) || new Date(),
      } as JournalEntry;
    });
    
    // Cache the result
    globalCache.set(cacheKey, entries, CACHE_TTL.JOURNAL_ENTRIES);
    
    return entries;
  } catch (error) {
    throw error;
  }
};

// --- Community Functions ---
export const getCommunityPosts = async (firestore: Firestore, options: { limit?: number } = {}): Promise<Post[]> => {
  const cacheKey = `community-posts-${options.limit || 'all'}`;
  
  // Check cache first
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const communityPostsCollection = collection(firestore, 'community-posts');
    const q = options.limit
      ? query(communityPostsCollection, orderBy('createdAt', 'desc'), limit(options.limit))
      : query(communityPostsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt) || new Date(),
        comments: data.comments?.map((c: any) => ({ ...c, createdAt: toDate(c.createdAt) || new Date() })) || [],
      } as Post
    });
    
    // Cache the result
    globalCache.set(cacheKey, posts, CACHE_TTL.COMMUNITY_POSTS);
    
    return posts;
  } catch (error) {
    throw error;
  }
};

// Real-time community posts subscription
export const subscribeToCommunityPosts = (
  firestore: Firestore,
  callback: (posts: Post[]) => void,
  options: { limit?: number } = {}
): Unsubscribe => {
  const communityPostsCollection = collection(firestore, 'community-posts');
  const q = options.limit
    ? query(communityPostsCollection, orderBy('createdAt', 'desc'), limit(options.limit))
    : query(communityPostsCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt) || new Date(),
        comments: data.comments?.map((c: any) => ({ ...c, createdAt: toDate(c.createdAt) || new Date() })) || [],
      } as Post
    });
    
    // Update cache
    const cacheKey = `community-posts-${options.limit || 'all'}`;
    globalCache.set(cacheKey, posts, CACHE_TTL.COMMUNITY_POSTS);
    
    callback(posts);
  });
};

// Like toggle with optimistic updates
export const togglePostLike = async (firestore: Firestore, postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(firestore, 'community-posts', postId);
    
    await runTransaction(firestore, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data() as Post;
      const isLiked = postData.likedBy.includes(userId);
      
      transaction.update(postRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    });
    
    // Invalidate community cache
    globalCache.delete('community-posts-all');
  } catch (error) {
    throw error;
  }
};

// Cleanup function for cache
export const cleanup = () => {
  globalCache.clear();
};