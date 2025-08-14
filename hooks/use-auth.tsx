
"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { app, auth, firestore } from '@/lib/firebase'; // Import the initialized services
import type { UserProfile, SubscriptionTierType } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import type { FirebaseApp } from 'firebase/app';
import type { Auth as FirebaseAuth } from 'firebase/auth';
import { getPlaceholderAvatar } from '@/lib/avatar-utils';

interface FirebaseServices {
  app: FirebaseApp;
  auth: FirebaseAuth;
  firestore: Firestore;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean; // True while onAuthStateChanged is running
  isProfileLoading: boolean; // True while the user's profile document is being fetched
  services: FirebaseServices; // Now guaranteed to be non-null
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: keyof typeof permissions) => boolean;
}

const permissions = {
  'ai_unlimited': ['Growth', 'Transformation'],
  'community_write': ['Growth', 'Transformation'],
  'journal_analysis': ['Growth', 'Transformation'],
  'audio_library': ['Growth', 'Transformation'],
  'ai_scenarios': ['Growth', 'Transformation'],
  'weekly_insights': ['Transformation'],
  'session_prep': ['Transformation'],
  'priority_booking': ['Transformation'],
  'session_discount': ['Transformation']
};

// The services object is now guaranteed to be available.
const services: FirebaseServices = { app, auth, firestore };

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isProfileLoading: true,
  services: services,
  refreshProfile: async () => {},
  hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    setIsProfileLoading(true);
    try {
      // Force refresh the token to get the latest custom claims. This is the fix.
      const idTokenResult = await getIdTokenResult(firebaseUser, true);
      const claims = idTokenResult.claims;

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userProfileData: UserProfile;
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        userProfileData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: data.name || firebaseUser.displayName || 'User',
          avatar: data.avatar || firebaseUser.photoURL || '',
          subscriptionTier: data.subscriptionTier || 'Explorer',
          messageCount: data.messageCount || 0,
          role: data.role || 'user',
          lastMessageDate: data.lastMessageDate ? data.lastMessageDate.toDate() : undefined,
          stripeCustomerId: data.stripeCustomerId,
          relationshipStatus: data.relationshipStatus,
          goals: data.goals || [],
          focusAreas: data.focusAreas || []
        };
      } else {
        // This case can happen for a brief moment after a new user signs up.
        // The cloud function that creates the user document might not have finished yet.
        console.warn(`User document not found for user ${firebaseUser.uid}. This may be a delay after signup.`);
        userProfileData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'Saga User',
          avatar: firebaseUser.photoURL || getPlaceholderAvatar(firebaseUser.displayName || 'Saga User'),
          subscriptionTier: 'Explorer',
          messageCount: 0,
          role: 'user'
        };
      }
      
      // Override profile with authoritative claims from the token. This is the source of truth for roles/tiers.
      userProfileData.role = (claims.role as 'user' | 'admin') || 'user';
      const tier = claims.subscriptionTier as SubscriptionTierType | 'admin';
      userProfileData.subscriptionTier = (tier === 'admin') ? 'Transformation' : (tier || 'Explorer');
      
      setProfile(userProfileData);

    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      
      // Only show toast for non-network errors to avoid spam
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('network')) {
        toast({
          title: "Error loading profile",
          description: error?.message || "Could not load user profile. Please refresh the page.",
          variant: "destructive",
        });
      }
      setProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setIsProfileLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setIsProfileLoading(false); // No profile to load
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]); 
  
  const refreshProfile = useCallback(async () => {
    if (user) {
        await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  const hasPermission = (permission: keyof typeof permissions): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    
    const requiredTiers = permissions[permission];
    // Cast profile.subscriptionTier to SubscriptionTierType for the check
    return requiredTiers?.includes(profile.subscriptionTier as SubscriptionTierType) || false;
  };
  
  const value = { user, profile, loading, isProfileLoading, services, refreshProfile, hasPermission };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
