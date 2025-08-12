/**
 * Subscription Service
 * Handles user subscription tier management and Firebase integration
 */

import { stripe } from './stripe';
import { firestore } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Stripe from 'stripe';

export type SubscriptionTier = 'Explorer' | 'Growth' | 'Transformation';

interface UserSubscription {
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  updatedAt: Date;
}

/**
 * Get user's current subscription from Firebase
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return userData.subscription || null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

/**
 * Update user subscription in Firebase
 */
export async function updateUserSubscription(
  userId: string, 
  subscription: Partial<UserSubscription>
): Promise<void> {
  try {
    await updateDoc(doc(firestore, 'users', userId), {
      'subscription': {
        ...subscription,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

/**
 * Determine subscription tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  // Growth tier price IDs
  if (priceId === 'price_growth_monthly' || priceId === 'price_growth_yearly') {
    return 'Growth';
  }
  
  // Transformation tier price IDs  
  if (priceId === 'price_transformation_monthly' || priceId === 'price_transformation_yearly') {
    return 'Transformation';
  }
  
  // Default to Explorer (free tier)
  return 'Explorer';
}

/**
 * Handle Stripe subscription update
 */
export async function handleStripeSubscriptionUpdate(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price.id;
    const tier = priceId ? getTierFromPriceId(priceId) : 'Explorer';

    const subscriptionUpdate: UserSubscription = {
      tier,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date()
    };

    await updateUserSubscription(userId, subscriptionUpdate);
    console.log(`Updated subscription for user ${userId} to ${tier} tier`);

  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

/**
 * Handle Stripe subscription cancellation
 */
export async function handleStripeSubscriptionCancellation(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    const subscriptionUpdate: UserSubscription = {
      tier: 'Explorer', // Downgrade to free tier
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'canceled',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: true,
      updatedAt: new Date()
    };

    await updateUserSubscription(userId, subscriptionUpdate);
    console.log(`Canceled subscription for user ${userId}, downgraded to Explorer tier`);

  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

/**
 * Check if user has access to a feature based on their subscription tier
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierHierarchy = {
    'Explorer': 1,
    'Growth': 2,
    'Transformation': 3
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

/**
 * Get subscription limits based on tier
 */
export function getSubscriptionLimits(tier: SubscriptionTier) {
  switch (tier) {
    case 'Explorer':
      return {
        monthlyJournalEntries: 10,
        monthlySOSSessions: 1,
        monthlyCoachingSessions: 0,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        hasPersonalizedPlans: false
      };
    
    case 'Growth':
      return {
        monthlyJournalEntries: 50,
        monthlySOSSessions: 5,
        monthlyCoachingSessions: 2,
        hasAdvancedAnalytics: true,
        hasPrioritySupport: false,
        hasPersonalizedPlans: true
      };
    
    case 'Transformation':
      return {
        monthlyJournalEntries: -1, // Unlimited
        monthlySOSSessions: -1, // Unlimited
        monthlyCoachingSessions: -1, // Unlimited
        hasAdvancedAnalytics: true,
        hasPrioritySupport: true,
        hasPersonalizedPlans: true
      };
    
    default:
      return getSubscriptionLimits('Explorer');
  }
}
