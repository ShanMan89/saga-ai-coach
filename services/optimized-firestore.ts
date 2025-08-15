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
  deleteDoc,
  startAfter,
  DocumentSnapshot,
  writeBatch,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import type { UserProfile, Message, Post, Comment, JournalEntry, Appointment, DailySchedule, AudioTip, AnalyzeJournalEntryOutput } from '@/lib/types';
import { withSimpleCache, globalCache } from '@/lib/simple-cache';
import { mark, measure } from '@/lib/simple-performance';

/**
 * Optimized Firestore service with caching and performance monitoring
 */

// Simple cache TTL configurations
const CACHE_TTL = {
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  CHAT_HISTORY: 5 * 60 * 1000,  // 5 minutes
  JOURNAL_ENTRIES: 15 * 60 * 1000, // 15 minutes
  COMMUNITY_POSTS: 2 * 60 * 1000,  // 2 minutes
};

// Query result cache for real-time subscriptions
const subscriptionCache = new Map<string, { unsubscribe: Unsubscribe; data: any }>();

// Pagination cursors cache
const paginationCache = new Map<string, DocumentSnapshot>();

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

// --- Optimized User Profile Functions ---
export const getUserProfile = async (firestore: Firestore, userId: string): Promise<UserProfile | null> => {
  const cacheKey = `user-profile-${userId}`;
  
  // Check cache first
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  mark('getUserProfile-start');
  
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const profile = createUserProfileFromData(data, userId);
      
      // Cache the result
      globalCache.set(cacheKey, profile, CACHE_TTL.USER_PROFILE);
      
      measure('getUserProfile', 'getUserProfile-start');
      return profile;
    }
    
    return null;
  } catch (error) {
    measure('getUserProfile', 'getUserProfile-start');
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

// Batch user operations for better performance
export const batchUpdateUsers = async (firestore: Firestore, updates: Array<{ userId: string; data: Partial<UserProfile> }>) => {
  performanceMonitor.mark('batchUpdateUsers-start');
  
  try {
    const batch = writeBatch(firestore);
    
    updates.forEach(({ userId, data }) => {
      const userDocRef = doc(firestore, 'users', userId);
      batch.update(userDocRef, data);
      
      // Invalidate individual user cache
      cacheInvalidation.invalidateUser(userId);
    });
    
    await batch.commit();
    
    performanceMonitor.mark('batchUpdateUsers-end');
    performanceMonitor.measure('batchUpdateUsers', 'batchUpdateUsers-start', 'batchUpdateUsers-end');
  } catch (error) {
    performanceMonitor.mark('batchUpdateUsers-error');
    throw error;
  }
};

export const getUsers = withCache(
  { ttl: 5 * 60 * 1000, key: () => 'all-users' },
  async (firestore: Firestore): Promise<UserProfile[]> => {
    performanceMonitor.mark('getUsers-start');
    
    try {
      const usersCollection = collection(firestore, 'users');
      const snapshot = await getDocs(usersCollection);
      
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return createUserProfileFromData(data, doc.id);
      });
      
      performanceMonitor.mark('getUsers-end');
      performanceMonitor.measure('getUsers', 'getUsers-start', 'getUsers-end');
      
      return users;
    } catch (error) {
      performanceMonitor.mark('getUsers-error');
      throw error;
    }
  }
);

// --- Optimized Chat History Functions ---
export const saveChatMessage = async (firestore: Firestore, userId: string, message: Message) => {
  performanceMonitor.mark('saveChatMessage-start');
  
  try {
    const batch = writeBatch(firestore);
    
    // Add message to chat history
    const chatHistoryRef = collection(firestore, `users/${userId}/chatHistory`);
    const messageDocRef = doc(chatHistoryRef);
    batch.set(messageDocRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    
    // Update user message count if it's a user message
    if (message.role === 'user') {
      const userDocRef = doc(firestore, 'users', userId);
      batch.update(userDocRef, {
        messageCount: increment(1),
        lastMessageDate: serverTimestamp()
      });
    }
    
    await batch.commit();
    
    // Invalidate relevant caches
    cacheInvalidation.invalidateUser(userId);
    globalCache.delete(CACHE_CONFIGS.CHAT_HISTORY.key(userId));
    
    performanceMonitor.mark('saveChatMessage-end');
    performanceMonitor.measure('saveChatMessage', 'saveChatMessage-start', 'saveChatMessage-end');
  } catch (error) {
    performanceMonitor.mark('saveChatMessage-error');
    throw error;
  }
};

export const getChatHistory = withCache(
  CACHE_CONFIGS.CHAT_HISTORY,
  async (firestore: Firestore, userId: string, limitCount = 20): Promise<Message[]> => {
    performanceMonitor.mark('getChatHistory-start');
    
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
      
      performanceMonitor.mark('getChatHistory-end');
      performanceMonitor.measure('getChatHistory', 'getChatHistory-start', 'getChatHistory-end');
      
      return messages;
    } catch (error) {
      performanceMonitor.mark('getChatHistory-error');
      throw error;
    }
  }
);

// Paginated chat history for better performance with large chat histories
export const getChatHistoryPaginated = async (
  firestore: Firestore, 
  userId: string, 
  limitCount = 20,
  cursor?: string
): Promise<{ messages: Message[]; nextCursor?: string; hasMore: boolean }> => {
  performanceMonitor.mark('getChatHistoryPaginated-start');
  
  try {
    const chatHistoryRef = collection(firestore, `users/${userId}/chatHistory`);
    let q = query(chatHistoryRef, orderBy('timestamp', 'desc'), limit(limitCount + 1));
    
    // Add pagination cursor if provided
    if (cursor) {
      const cursorDoc = paginationCache.get(cursor);
      if (cursorDoc) {
        q = query(chatHistoryRef, orderBy('timestamp', 'desc'), startAfter(cursorDoc), limit(limitCount + 1));
      }
    }
    
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    // Check if there are more results
    const hasMore = docs.length > limitCount;
    const messages = docs.slice(0, limitCount);
    
    // Store cursor for pagination
    let nextCursor: string | undefined;
    if (hasMore) {
      nextCursor = `cursor-${Date.now()}-${Math.random()}`;
      paginationCache.set(nextCursor, docs[limitCount - 1]);
    }
    
    const result = {
      messages: messages.map(doc => {
        const data = doc.data();
        return {
          role: data.role,
          content: data.content,
          suggestions: data.suggestions,
        } as Message;
      }).reverse(),
      nextCursor,
      hasMore
    };
    
    performanceMonitor.mark('getChatHistoryPaginated-end');
    performanceMonitor.measure('getChatHistoryPaginated', 'getChatHistoryPaginated-start', 'getChatHistoryPaginated-end');
    
    return result;
  } catch (error) {
    performanceMonitor.mark('getChatHistoryPaginated-error');
    throw error;
  }
};

// --- Optimized Journal Functions ---
export const saveJournalEntry = async (firestore: Firestore, userId: string, entryData: { content: string, analysis?: AnalyzeJournalEntryOutput | null }): Promise<string> => {
  performanceMonitor.mark('saveJournalEntry-start');
  
  try {
    const entriesRef = collection(firestore, 'journalEntries');
    const docRef = await addDoc(entriesRef, {
      userId: userId,
      content: entryData.content,
      analysis: entryData.analysis,
      date: serverTimestamp()
    });
    
    // Invalidate journal cache
    globalCache.delete(CACHE_CONFIGS.JOURNAL_ENTRIES.key(userId));
    
    performanceMonitor.mark('saveJournalEntry-end');
    performanceMonitor.measure('saveJournalEntry', 'saveJournalEntry-start', 'saveJournalEntry-end');
    
    return docRef.id;
  } catch (error) {
    performanceMonitor.mark('saveJournalEntry-error');
    throw error;
  }
};

export const getJournalEntries = withCache(
  CACHE_CONFIGS.JOURNAL_ENTRIES,
  async (firestore: Firestore, userId: string, limitCount = 50): Promise<JournalEntry[]> => {
    performanceMonitor.mark('getJournalEntries-start');
    
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
      
      performanceMonitor.mark('getJournalEntries-end');
      performanceMonitor.measure('getJournalEntries', 'getJournalEntries-start', 'getJournalEntries-end');
      
      return entries;
    } catch (error) {
      performanceMonitor.mark('getJournalEntries-error');
      throw error;
    }
  }
);

// --- Optimized Community Functions with Real-time Updates ---
export const getCommunityPosts = withCache(
  CACHE_CONFIGS.COMMUNITY_POSTS,
  async (firestore: Firestore, options: { limit?: number } = {}): Promise<Post[]> => {
    performanceMonitor.mark('getCommunityPosts-start');
    
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
      
      performanceMonitor.mark('getCommunityPosts-end');
      performanceMonitor.measure('getCommunityPosts', 'getCommunityPosts-start', 'getCommunityPosts-end');
      
      return posts;
    } catch (error) {
      performanceMonitor.mark('getCommunityPosts-error');
      throw error;
    }
  }
);

// Real-time community posts subscription
export const subscribeToCommunityPosts = (
  firestore: Firestore,
  callback: (posts: Post[]) => void,
  options: { limit?: number } = {}
): Unsubscribe => {
  const subscriptionKey = `community-posts-${options.limit || 'all'}`;
  
  // Check if subscription already exists
  if (subscriptionCache.has(subscriptionKey)) {
    const cached = subscriptionCache.get(subscriptionKey);
    if (cached) {
      callback(cached.data);
      return cached.unsubscribe;
    }
  }
  
  const communityPostsCollection = collection(firestore, 'community-posts');
  const q = options.limit
    ? query(communityPostsCollection, orderBy('createdAt', 'desc'), limit(options.limit))
    : query(communityPostsCollection, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
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
    subscriptionCache.set(subscriptionKey, { unsubscribe, data: posts });
    globalCache.set(CACHE_CONFIGS.COMMUNITY_POSTS.key(), posts, CACHE_CONFIGS.COMMUNITY_POSTS.ttl);
    
    callback(posts);
  });
  
  return () => {
    unsubscribe();
    subscriptionCache.delete(subscriptionKey);
  };
};

// Optimized like toggle with optimistic updates
export const togglePostLike = async (firestore: Firestore, postId: string, userId: string): Promise<void> => {
  performanceMonitor.mark('togglePostLike-start');
  
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
    cacheInvalidation.invalidateCommunity();
    
    performanceMonitor.mark('togglePostLike-end');
    performanceMonitor.measure('togglePostLike', 'togglePostLike-start', 'togglePostLike-end');
  } catch (error) {
    performanceMonitor.mark('togglePostLike-error');
    throw error;
  }
};

// --- Connection Management for Offline Support ---
export const enableOfflineSupport = async (firestore: Firestore) => {
  try {
    await enableNetwork(firestore);
  } catch (error) {
    console.warn('Failed to enable offline support:', error);
  }
};

export const disableOfflineSupport = async (firestore: Firestore) => {
  try {
    await disableNetwork(firestore);
  } catch (error) {
    console.warn('Failed to disable offline support:', error);
  }
};

// Cleanup function for subscriptions and caches
export const cleanup = () => {
  // Unsubscribe from all real-time subscriptions
  subscriptionCache.forEach(({ unsubscribe }) => {
    unsubscribe();
  });
  subscriptionCache.clear();
  
  // Clear pagination cache
  paginationCache.clear();
  
  // Clear global cache
  globalCache.clear();
};

// --- Health Check ---
export const healthCheck = async (firestore: Firestore): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }> => {
  const startTime = Date.now();
  
  try {
    // Simple read operation to test connectivity
    const testDocRef = doc(firestore, '_health', 'check');
    await getDoc(testDocRef);
    
    const latency = Date.now() - startTime;
    
    if (latency < 500) {
      return { status: 'healthy', latency };
    } else if (latency < 2000) {
      return { status: 'degraded', latency };
    } else {
      return { status: 'unhealthy', latency };
    }
  } catch (error) {
    return { status: 'unhealthy', latency: Date.now() - startTime };
  }
};

// Export all original functions for backward compatibility
export * from './firestore';