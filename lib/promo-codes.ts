/**
 * Promo Code System for Saga AI Coach
 * Handles discount codes and special offers
 */

export interface PromoCode {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // Percentage (e.g., 25) or fixed amount (e.g., 10.00)
  validFor: ('Growth' | 'Transformation')[];
  validUntil: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  metadata?: {
    campaign?: string;
    source?: string;
  };
}

// Predefined promo codes for different tiers and campaigns
export const PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME25',
    description: '25% off your first month - New users only',
    discountType: 'percentage',
    discountValue: 25,
    validFor: ['Growth', 'Transformation'],
    validUntil: new Date('2024-12-31'),
    maxUses: 1000,
    currentUses: 0,
    isActive: true,
    metadata: {
      campaign: 'new-user-welcome',
      source: 'onboarding'
    }
  },
  {
    code: 'GROWTH50',
    description: '50% off Growth Plan - Limited time offer',
    discountType: 'percentage',
    discountValue: 50,
    validFor: ['Growth'],
    validUntil: new Date('2024-12-31'),
    maxUses: 500,
    currentUses: 0,
    isActive: true,
    metadata: {
      campaign: 'growth-promotion',
      source: 'marketing'
    }
  },
  {
    code: 'TRANSFORM30',
    description: '30% off Transformation Plan',
    discountType: 'percentage',
    discountValue: 30,
    validFor: ['Transformation'],
    validUntil: new Date('2024-12-31'),
    maxUses: 200,
    currentUses: 0,
    isActive: true,
    metadata: {
      campaign: 'transformation-special',
      source: 'email'
    }
  },
  {
    code: 'SAVE10',
    description: '$10 off any plan',
    discountType: 'fixed',
    discountValue: 10.00,
    validFor: ['Growth', 'Transformation'],
    validUntil: new Date('2024-12-31'),
    maxUses: 300,
    currentUses: 0,
    isActive: true,
    metadata: {
      campaign: 'general-discount',
      source: 'social'
    }
  },
  {
    code: 'EARLYBIRD',
    description: 'Early bird special - 40% off first 3 months',
    discountType: 'percentage',
    discountValue: 40,
    validFor: ['Growth', 'Transformation'],
    validUntil: new Date('2024-12-31'),
    maxUses: 100,
    currentUses: 0,
    isActive: true,
    metadata: {
      campaign: 'early-access',
      source: 'beta-users'
    }
  },
  {
    code: 'STUDENT',
    description: 'Student discount - 60% off any plan',
    discountType: 'percentage',
    discountValue: 60,
    validFor: ['Growth', 'Transformation'],
    validUntil: new Date('2024-12-31'),
    currentUses: 0,
    isActive: true,
    metadata: {
      campaign: 'student-discount',
      source: 'education'
    }
  }
];

export interface PromoCodeValidation {
  isValid: boolean;
  errorMessage?: string;
  discountAmount?: number;
  finalPrice?: number;
  promoCode?: PromoCode;
}

/**
 * Validates a promo code for a specific plan and billing cycle
 */
export const validatePromoCode = (
  code: string,
  planTier: 'Growth' | 'Transformation',
  originalPrice: number
): PromoCodeValidation => {
  // Find the promo code
  const promoCode = PROMO_CODES.find(pc => 
    pc.code.toLowerCase() === code.toLowerCase()
  );

  if (!promoCode) {
    return {
      isValid: false,
      errorMessage: 'Invalid promo code'
    };
  }

  // Check if code is active
  if (!promoCode.isActive) {
    return {
      isValid: false,
      errorMessage: 'This promo code is no longer active'
    };
  }

  // Check if code is valid for this plan
  if (!promoCode.validFor.includes(planTier)) {
    return {
      isValid: false,
      errorMessage: `This promo code is not valid for the ${planTier} plan`
    };
  }

  // Check if code has expired
  if (promoCode.validUntil < new Date()) {
    return {
      isValid: false,
      errorMessage: 'This promo code has expired'
    };
  }

  // Check usage limits
  if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
    return {
      isValid: false,
      errorMessage: 'This promo code has reached its usage limit'
    };
  }

  // Calculate discount
  let discountAmount: number;
  if (promoCode.discountType === 'percentage') {
    discountAmount = (originalPrice * promoCode.discountValue) / 100;
  } else {
    discountAmount = Math.min(promoCode.discountValue, originalPrice);
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    isValid: true,
    discountAmount,
    finalPrice,
    promoCode
  };
};

/**
 * Apply a promo code (increment usage counter)
 */
export const applyPromoCode = (code: string): boolean => {
  const promoCode = PROMO_CODES.find(pc => 
    pc.code.toLowerCase() === code.toLowerCase()
  );

  if (promoCode) {
    promoCode.currentUses += 1;
    return true;
  }

  return false;
};

/**
 * Get all active promo codes for display purposes
 */
export const getActivePromoCodes = (planTier?: 'Growth' | 'Transformation'): PromoCode[] => {
  return PROMO_CODES.filter(pc => {
    if (!pc.isActive) return false;
    if (pc.validUntil < new Date()) return false;
    if (pc.maxUses && pc.currentUses >= pc.maxUses) return false;
    if (planTier && !pc.validFor.includes(planTier)) return false;
    return true;
  });
};

/**
 * Format discount display text
 */
export const formatDiscount = (promoCode: PromoCode): string => {
  if (promoCode.discountType === 'percentage') {
    return `${promoCode.discountValue}% off`;
  } else {
    return `$${promoCode.discountValue.toFixed(2)} off`;
  }
};

/**
 * Get promo code by code string
 */
export const getPromoCodeByCode = (code: string): PromoCode | undefined => {
  return PROMO_CODES.find(pc => 
    pc.code.toLowerCase() === code.toLowerCase()
  );
};

/**
 * Create Stripe coupon data from promo code
 */
export const createStripeCouponFromPromoCode = (promoCode: PromoCode) => {
  if (promoCode.discountType === 'percentage') {
    return {
      percent_off: promoCode.discountValue,
      duration: 'once' as const, // Apply once to first payment
      name: promoCode.description,
      id: promoCode.code.toLowerCase()
    };
  } else {
    return {
      amount_off: Math.round(promoCode.discountValue * 100), // Convert to cents
      currency: 'usd' as const,
      duration: 'once' as const,
      name: promoCode.description,
      id: promoCode.code.toLowerCase()
    };
  }
};