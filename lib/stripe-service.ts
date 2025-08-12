/**
 * Stripe Service for Subscription Management
 */

import { getStripePriceId } from './pricing';

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionData {
  tier: 'Explorer' | 'Growth' | 'Transformation';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  billing: 'monthly' | 'yearly';
}

/**
 * Create a Stripe checkout session for subscription
 */
export const createCheckoutSession = async (params: CreateCheckoutSessionParams) => {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Subscribe user to a plan
 */
export const subscribeToplan = async (
  tier: 'Growth' | 'Transformation',
  billing: 'monthly' | 'yearly',
  userId: string,
  customerEmail: string
) => {
  const priceId = getStripePriceId(tier, billing);
  
  if (!priceId) {
    throw new Error(`Price ID not found for ${tier} ${billing} plan`);
  }

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=canceled`;

  return createCheckoutSession({
    priceId,
    userId,
    customerEmail,
    successUrl,
    cancelUrl,
  });
};

/**
 * Get user's current subscription data
 */
export const getUserSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    const response = await fetch(`/api/stripe/subscription?userId=${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No subscription found
      }
      throw new Error('Failed to get subscription');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
};

/**
 * Cancel user's subscription
 */
export const cancelSubscription = async (userId: string) => {
  try {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Create customer portal session for subscription management
 */
export const createPortalSession = async (userId: string) => {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};
