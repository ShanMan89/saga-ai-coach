/**
 * Comprehensive validation schemas for Saga AI Coach
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod';

// User Profile Validation
export const userProfileSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  subscriptionTier: z.enum(['Explorer', 'Growth', 'Transformation']),
  messageCount: z.number().min(0, 'Message count cannot be negative').optional(),
  role: z.enum(['user', 'admin']).default('user'),
  relationshipStatus: z.enum([
    'single', 'dating', 'engaged', 'married', 'divorced', 'complicated', 'other'
  ]).optional(),
  goals: z.array(z.string().min(1).max(200)).max(10, 'Too many goals').optional(),
  focusAreas: z.array(z.string().min(1).max(100)).max(15, 'Too many focus areas').optional(),
});

// Authentication Validation
export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and numbers'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Onboarding Validation
export const onboardingSchema = z.object({
  step: z.number().min(1).max(5),
  data: z.object({
    relationshipStatus: z.enum([
      'single', 'dating', 'engaged', 'married', 'divorced', 'complicated', 'other'
    ]).optional(),
    goals: z.array(z.string().min(1).max(200)).min(1, 'Select at least one goal').max(5, 'Maximum 5 goals'),
    focusAreas: z.array(z.string().min(1).max(100)).max(10, 'Maximum 10 focus areas').optional(),
    journalPrompt: z.string().min(10, 'Please write at least 10 characters').max(2000, 'Too long').optional(),
    communicationStyle: z.enum(['direct', 'gentle', 'motivational', 'analytical']).optional(),
    preferredTone: z.enum(['supportive', 'challenging', 'neutral', 'encouraging']).optional(),
  }),
});

// AI Chat Validation
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long (max 5000 characters)')
    .refine(msg => msg.trim().length > 0, 'Message cannot be only whitespace'),
  userProfile: userProfileSchema,
  previousMessages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.date().optional(),
  })).optional(),
  context: z.string().max(1000, 'Context too long').optional(),
});

// Journal Entry Validation
export const journalEntrySchema = z.object({
  entry: z.string()
    .min(10, 'Journal entry must be at least 10 characters')
    .max(10000, 'Journal entry too long (max 10,000 characters)'),
  mood: z.enum(['very-happy', 'happy', 'neutral', 'sad', 'very-sad', 'anxious', 'excited', 'frustrated']).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags').optional(),
  isPrivate: z.boolean().default(false),
  userProfile: userProfileSchema,
});

// SOS Booking Validation
export const sosBookingSchema = z.object({
  slot: z.string().datetime('Invalid date/time format'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'emergency']).default('medium'),
  reason: z.string()
    .min(10, 'Please provide at least 10 characters explaining your situation')
    .max(1000, 'Reason too long (max 1000 characters)'),
  contactNumber: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  userProfile: userProfileSchema,
}).refine(data => {
  const slotDate = new Date(data.slot);
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  return slotDate > thirtyMinutesFromNow;
}, {
  message: 'SOS session must be scheduled at least 30 minutes in advance',
  path: ['slot'],
});

// Community Post Validation
export const communityPostSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title too long (max 200 characters)'),
  content: z.string()
    .min(10, 'Post content must be at least 10 characters')
    .max(5000, 'Post too long (max 5000 characters)'),
  category: z.enum(['general', 'advice', 'success-story', 'question', 'support']),
  tags: z.array(z.string().min(1).max(30)).max(5, 'Maximum 5 tags').optional(),
  isAnonymous: z.boolean().default(false),
});

export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long (max 1000 characters)'),
  parentCommentId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

// Payment Validation
export const checkoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  customerEmail: z.string().email('Invalid email address'),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional(),
  promoCode: z.string().max(50, 'Promo code too long').optional(),
});

// Admin Validation
export const adminUserUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  updates: z.object({
    role: z.enum(['user', 'admin']).optional(),
    subscriptionTier: z.enum(['Explorer', 'Growth', 'Transformation']).optional(),
    status: z.enum(['active', 'suspended', 'banned']).optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
  }),
});

// File Upload Validation
export const fileUploadSchema = z.object({
  file: z.object({
    name: z.string(),
    size: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
    type: z.string().refine(
      type => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
      'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
    ),
  }),
  purpose: z.enum(['avatar', 'community-image', 'journal-attachment']),
});

// Environment Variables Validation
export const envSchema = z.object({
  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID: z.string().startsWith('price_'),
  
  // Email
  RESEND_API_KEY: z.string().startsWith('re_'),
  
  // Optional
  GOOGLE_CALENDAR_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CALENDAR_CLIENT_EMAIL: z.string().email().optional(),
});

// API Response Validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

// Rate Limiting Validation
export const rateLimitSchema = z.object({
  identifier: z.string().min(1),
  action: z.enum(['chat', 'journal', 'sos-booking', 'community-post', 'api-call']),
  tier: z.enum(['Explorer', 'Growth', 'Transformation']),
});

// Export validation helper functions
export type UserProfile = z.infer<typeof userProfileSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type SOSBooking = z.infer<typeof sosBookingSchema>;
export type CommunityPost = z.infer<typeof communityPostSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type RateLimit = z.infer<typeof rateLimitSchema>;

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
  };
};

export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown) => {
    const validation = validateSchema(schema, data);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    return validation.data;
  };
};