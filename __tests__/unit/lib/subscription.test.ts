/**
 * @jest-environment node
 */

import {
  getUserSubscription,
  updateUserSubscription,
  getTierFromPriceId,
  handleStripeSubscriptionUpdate,
  handleStripeSubscriptionCancellation,
  hasFeatureAccess,
  getSubscriptionLimits,
  SubscriptionTier,
} from '@/lib/subscription'
import { firestore } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Stripe from 'stripe'

// Mock dependencies
jest.mock('@/lib/firebase')
jest.mock('firebase/firestore')

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockDoc = doc as jest.MockedFunction<typeof doc>

describe('Subscription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDoc.mockReturnValue({} as any)

    // Mock environment variables
    process.env.STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID = 'price_growth_monthly'
    process.env.STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID = 'price_growth_yearly'
    process.env.STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID = 'price_transformation_monthly'
    process.env.STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID = 'price_transformation_yearly'
  })

  describe('getUserSubscription', () => {
    it('should return user subscription if document exists', async () => {
      const mockSubscription = {
        tier: 'Growth',
        stripeCustomerId: 'cus_123',
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      }

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ subscription: mockSubscription }),
      } as any)

      const result = await getUserSubscription('user123')
      expect(result).toEqual(mockSubscription)
      expect(mockDoc).toHaveBeenCalledWith(firestore, 'users', 'user123')
    })

    it('should return null if document does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any)

      const result = await getUserSubscription('user123')
      expect(result).toBeNull()
    })

    it('should return null if subscription data is missing', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      } as any)

      const result = await getUserSubscription('user123')
      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firestore error'))

      const result = await getUserSubscription('user123')
      expect(result).toBeNull()
    })
  })

  describe('updateUserSubscription', () => {
    it('should update subscription successfully', async () => {
      const subscriptionUpdate = {
        tier: 'Growth' as SubscriptionTier,
        stripeCustomerId: 'cus_123',
      }

      mockUpdateDoc.mockResolvedValue(undefined)

      await updateUserSubscription('user123', subscriptionUpdate)

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          subscription: {
            ...subscriptionUpdate,
            updatedAt: expect.any(Date),
          },
        }
      )
    })

    it('should throw error if update fails', async () => {
      const subscriptionUpdate = {
        tier: 'Growth' as SubscriptionTier,
      }

      mockUpdateDoc.mockRejectedValue(new Error('Update failed'))

      await expect(updateUserSubscription('user123', subscriptionUpdate)).rejects.toThrow(
        'Update failed'
      )
    })
  })

  describe('getTierFromPriceId', () => {
    it('should return Growth tier for Growth monthly price', () => {
      const result = getTierFromPriceId('price_growth_monthly')
      expect(result).toBe('Growth')
    })

    it('should return Growth tier for Growth yearly price', () => {
      const result = getTierFromPriceId('price_growth_yearly')
      expect(result).toBe('Growth')
    })

    it('should return Transformation tier for Transformation monthly price', () => {
      const result = getTierFromPriceId('price_transformation_monthly')
      expect(result).toBe('Transformation')
    })

    it('should return Transformation tier for Transformation yearly price', () => {
      const result = getTierFromPriceId('price_transformation_yearly')
      expect(result).toBe('Transformation')
    })

    it('should return Explorer tier for unknown price ID', () => {
      const result = getTierFromPriceId('price_unknown')
      expect(result).toBe('Explorer')
    })

    it('should return Explorer tier for empty price ID', () => {
      const result = getTierFromPriceId('')
      expect(result).toBe('Explorer')
    })
  })

  describe('handleStripeSubscriptionUpdate', () => {
    it('should handle subscription update successfully', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        current_period_end: 1609459200, // 2021-01-01
        cancel_at_period_end: false,
        metadata: { userId: 'user123' },
        items: {
          data: [{ price: { id: 'price_growth_monthly' } }] as any,
        } as any,
      }

      mockUpdateDoc.mockResolvedValue(undefined)

      await handleStripeSubscriptionUpdate(mockSubscription as Stripe.Subscription)

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          subscription: {
            tier: 'Growth',
            stripeCustomerId: 'cus_123',
            stripeSubscriptionId: 'sub_123',
            subscriptionStatus: 'active',
            currentPeriodEnd: new Date(1609459200 * 1000),
            cancelAtPeriodEnd: false,
            updatedAt: expect.any(Date),
          },
        }
      )
    })

    it('should handle subscription without userId in metadata', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_123',
        metadata: {},
        items: { data: [] } as any,
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await handleStripeSubscriptionUpdate(mockSubscription as Stripe.Subscription)

      expect(consoleSpy).toHaveBeenCalledWith('No userId found in subscription metadata')
      expect(mockUpdateDoc).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle subscription without items', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        current_period_end: 1609459200,
        cancel_at_period_end: false,
        metadata: { userId: 'user123' },
        items: { data: [] } as any,
      }

      mockUpdateDoc.mockResolvedValue(undefined)

      await handleStripeSubscriptionUpdate(mockSubscription as Stripe.Subscription)

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          subscription: expect.objectContaining({
            tier: 'Explorer', // Default when no price ID
          }),
        }
      )
    })

    it('should handle Firestore update errors', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        current_period_end: 1609459200,
        cancel_at_period_end: false,
        metadata: { userId: 'user123' },
        items: {
          data: [{ price: { id: 'price_growth_monthly' } }] as any,
        } as any,
      }

      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'))

      await expect(
        handleStripeSubscriptionUpdate(mockSubscription as Stripe.Subscription)
      ).rejects.toThrow('Firestore error')
    })
  })

  describe('handleStripeSubscriptionCancellation', () => {
    it('should handle subscription cancellation successfully', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'canceled',
        current_period_end: 1609459200,
        metadata: { userId: 'user123' },
      }

      mockUpdateDoc.mockResolvedValue(undefined)

      await handleStripeSubscriptionCancellation(mockSubscription as Stripe.Subscription)

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          subscription: {
            tier: 'Explorer',
            stripeCustomerId: 'cus_123',
            stripeSubscriptionId: 'sub_123',
            subscriptionStatus: 'canceled',
            currentPeriodEnd: new Date(1609459200 * 1000),
            cancelAtPeriodEnd: true,
            updatedAt: expect.any(Date),
          },
        }
      )
    })

    it('should handle cancellation without userId in metadata', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_123',
        metadata: {},
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await handleStripeSubscriptionCancellation(mockSubscription as Stripe.Subscription)

      expect(consoleSpy).toHaveBeenCalledWith('No userId found in subscription metadata')
      expect(mockUpdateDoc).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle Firestore update errors', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'canceled',
        current_period_end: 1609459200,
        metadata: { userId: 'user123' },
      }

      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'))

      await expect(
        handleStripeSubscriptionCancellation(mockSubscription as Stripe.Subscription)
      ).rejects.toThrow('Firestore error')
    })
  })

  describe('hasFeatureAccess', () => {
    it('should grant access when user tier is equal to required tier', () => {
      expect(hasFeatureAccess('Growth', 'Growth')).toBe(true)
    })

    it('should grant access when user tier is higher than required tier', () => {
      expect(hasFeatureAccess('Transformation', 'Growth')).toBe(true)
      expect(hasFeatureAccess('Growth', 'Explorer')).toBe(true)
    })

    it('should deny access when user tier is lower than required tier', () => {
      expect(hasFeatureAccess('Explorer', 'Growth')).toBe(false)
      expect(hasFeatureAccess('Growth', 'Transformation')).toBe(false)
    })

    it('should handle all tier combinations correctly', () => {
      // Explorer tier
      expect(hasFeatureAccess('Explorer', 'Explorer')).toBe(true)
      expect(hasFeatureAccess('Explorer', 'Growth')).toBe(false)
      expect(hasFeatureAccess('Explorer', 'Transformation')).toBe(false)

      // Growth tier
      expect(hasFeatureAccess('Growth', 'Explorer')).toBe(true)
      expect(hasFeatureAccess('Growth', 'Growth')).toBe(true)
      expect(hasFeatureAccess('Growth', 'Transformation')).toBe(false)

      // Transformation tier
      expect(hasFeatureAccess('Transformation', 'Explorer')).toBe(true)
      expect(hasFeatureAccess('Transformation', 'Growth')).toBe(true)
      expect(hasFeatureAccess('Transformation', 'Transformation')).toBe(true)
    })
  })

  describe('getSubscriptionLimits', () => {
    it('should return correct limits for Explorer tier', () => {
      const limits = getSubscriptionLimits('Explorer')
      expect(limits).toEqual({
        monthlyJournalEntries: 10,
        monthlySOSSessions: 1,
        monthlyCoachingSessions: 0,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        hasPersonalizedPlans: false,
      })
    })

    it('should return correct limits for Growth tier', () => {
      const limits = getSubscriptionLimits('Growth')
      expect(limits).toEqual({
        monthlyJournalEntries: 50,
        monthlySOSSessions: 5,
        monthlyCoachingSessions: 2,
        hasAdvancedAnalytics: true,
        hasPrioritySupport: false,
        hasPersonalizedPlans: true,
      })
    })

    it('should return correct limits for Transformation tier', () => {
      const limits = getSubscriptionLimits('Transformation')
      expect(limits).toEqual({
        monthlyJournalEntries: -1,
        monthlySOSSessions: -1,
        monthlyCoachingSessions: -1,
        hasAdvancedAnalytics: true,
        hasPrioritySupport: true,
        hasPersonalizedPlans: true,
      })
    })

    it('should return Explorer limits for invalid tier', () => {
      const limits = getSubscriptionLimits('InvalidTier' as SubscriptionTier)
      expect(limits).toEqual(getSubscriptionLimits('Explorer'))
    })
  })
})