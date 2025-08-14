/**
 * Pricing Configuration for Saga AI Coach
 * Defines subscription tiers, features, and pricing
 */

export interface PricingPlan {
  name: string;
  tier: 'Explorer' | 'Growth' | 'Transformation';
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  stripePriceIds: {
    monthly?: string;
    yearly?: string;
  };
  features: string[];
  limits: {
    aiChatSessions: number | 'unlimited';
    sosSessionsPerMonth: number | 'unlimited';
    videoCoachingSessions: number;
    communityAccess: 'read-only' | 'full';
    support: 'email' | 'priority-email' | 'phone-chat';
  };
  popular?: boolean;
  color: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Explorer',
    tier: 'Explorer',
    description: 'Get started with basic relationship insights and limited AI coaching sessions',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    stripePriceIds: {
      // Free tier doesn't need Stripe price IDs
    },
    features: [
      '10 AI chat sessions per month',
      'Basic journal analysis',
      'Community access (read-only)',
      'Email support',
      'Relationship goal setting'
    ],
    limits: {
      aiChatSessions: 10,
      sosSessionsPerMonth: 0,
      videoCoachingSessions: 0,
      communityAccess: 'read-only',
      support: 'email'
    },
    color: 'bg-gray-100 border-gray-200'
  },
  {
    name: 'Growth Plan',
    tier: 'Growth',
    description: 'Accelerate your relationship growth with unlimited AI coaching and advanced insights',
    monthlyPrice: 19.99,
    yearlyPrice: 199,
    yearlyDiscount: 17,
    stripePriceIds: {
      monthly: process.env.STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID,
    },
    features: [
      'Unlimited AI chat sessions',
      'Advanced journal analysis with weekly insights',
      'Full community access (post & comment)',
      '2 SOS emergency coaching sessions per month',
      'Priority email support',
      'Relationship milestone tracking',
      'Personalized relationship tips'
    ],
    limits: {
      aiChatSessions: 'unlimited',
      sosSessionsPerMonth: 2,
      videoCoachingSessions: 0,
      communityAccess: 'full',
      support: 'priority-email'
    },
    popular: true,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    name: 'Transformation Plan',
    tier: 'Transformation',
    description: 'Complete relationship transformation with personalized coaching and premium features',
    monthlyPrice: 49.99,
    yearlyPrice: 499,
    yearlyDiscount: 17,
    stripePriceIds: {
      monthly: process.env.STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID,
    },
    features: [
      'Everything in Growth Plan',
      'Unlimited SOS emergency sessions',
      '2 one-on-one video coaching sessions per month',
      'Custom relationship action plans',
      'Advanced analytics & insights',
      'Priority phone & chat support',
      'Early access to new features',
      'Relationship compatibility analysis'
    ],
    limits: {
      aiChatSessions: 'unlimited',
      sosSessionsPerMonth: 'unlimited',
      videoCoachingSessions: 2,
      communityAccess: 'full',
      support: 'phone-chat'
    },
    color: 'bg-purple-50 border-purple-200'
  }
];

export const getPlanByTier = (tier: 'Explorer' | 'Growth' | 'Transformation'): PricingPlan | undefined => {
  return PRICING_PLANS.find(plan => plan.tier === tier);
};

export const getStripePriceId = (tier: 'Growth' | 'Transformation', billing: 'monthly' | 'yearly'): string | undefined => {
  const plan = getPlanByTier(tier);
  return plan?.stripePriceIds[billing];
};

export const formatPrice = (price: number): string => {
  return price === 0 ? 'Free' : `$${price}`;
};

export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPrice: number): number => {
  if (monthlyPrice === 0 || yearlyPrice === 0) return 0;
  const yearlyEquivalent = monthlyPrice * 12;
  return Math.round(((yearlyEquivalent - yearlyPrice) / yearlyEquivalent) * 100);
};
