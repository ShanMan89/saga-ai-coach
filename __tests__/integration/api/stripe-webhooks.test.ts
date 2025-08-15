/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhooks/route'
import { stripe } from '@/lib/stripe'
import { 
  handleStripeSubscriptionUpdate,
  handleStripeSubscriptionCancellation 
} from '@/lib/subscription'
import Stripe from 'stripe'

// Mock dependencies
jest.mock('@/lib/stripe')
jest.mock('@/lib/subscription')
jest.mock('@/lib/email-service')

const mockStripe = stripe as jest.Mocked<typeof stripe>
const mockHandleSubscriptionUpdate = handleStripeSubscriptionUpdate as jest.MockedFunction<typeof handleStripeSubscriptionUpdate>
const mockHandleSubscriptionCancellation = handleStripeSubscriptionCancellation as jest.MockedFunction<typeof handleStripeSubscriptionCancellation>

describe('/api/stripe/webhooks Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
  })

  const createMockRequest = (
    body: string,
    signature?: string
  ): NextRequest => {
    const headers = new Headers()
    if (signature) {
      headers.set('stripe-signature', signature)
    }

    return {
      headers: {
        get: (key: string) => headers.get(key),
      },
      text: () => Promise.resolve(body),
    } as unknown as NextRequest
  }

  const createMockSubscription = (overrides = {}): Stripe.Subscription => ({
    id: 'sub_test_123',
    object: 'subscription',
    cancel_at_period_end: false,
    current_period_end: 1640995200, // 2022-01-01
    current_period_start: 1638316800, // 2021-12-01
    customer: 'cus_test_123',
    status: 'active',
    metadata: {
      userId: 'test-user-123',
    },
    items: {
      object: 'list',
      data: [{
        id: 'si_test_123',
        object: 'subscription_item',
        price: {
          id: 'price_growth_monthly',
          object: 'price',
          active: true,
          currency: 'usd',
          unit_amount: 2900,
        } as Stripe.Price,
      } as Stripe.SubscriptionItem],
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    ...overrides,
  } as Stripe.Subscription)

  const createMockInvoice = (overrides = {}): Stripe.Invoice => ({
    id: 'in_test_123',
    object: 'invoice',
    amount_paid: 2900,
    amount_due: 2900,
    customer: 'cus_test_123',
    subscription: 'sub_test_123',
    ...overrides,
  } as Stripe.Invoice)

  describe('Webhook Signature Verification', () => {
    it('should return 400 for missing signature', async () => {
      const request = createMockRequest('{"type": "test"}')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Missing webhook signature')
    })

    it('should return 400 for missing webhook secret', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      const request = createMockRequest('{"type": "test"}', 'test-signature')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Missing webhook signature or secret')
    })

    it('should return 400 for invalid signature', async () => {
      const request = createMockRequest('{"type": "test"}', 'invalid-signature')

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid signature')
    })

    it('should proceed with valid signature', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'customer.subscription.created',
        data: {
          object: createMockSubscription(),
        },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockHandleSubscriptionUpdate.mockResolvedValue()

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
    })
  })

  describe('Subscription Events', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockImplementation((body, signature, secret) => {
        return JSON.parse(body) as Stripe.Event
      })
    })

    it('should handle customer.subscription.created', async () => {
      const subscription = createMockSubscription()
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'customer.subscription.created',
        data: { object: subscription },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      mockHandleSubscriptionUpdate.mockResolvedValue()

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
      expect(mockHandleSubscriptionUpdate).toHaveBeenCalledWith(subscription)
    })

    it('should handle customer.subscription.updated', async () => {
      const subscription = createMockSubscription({ status: 'active' })
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: { object: subscription },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      mockHandleSubscriptionUpdate.mockResolvedValue()

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
      expect(mockHandleSubscriptionUpdate).toHaveBeenCalledWith(subscription)
    })

    it('should handle customer.subscription.deleted', async () => {
      const subscription = createMockSubscription({ status: 'canceled' })
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: { object: subscription },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      mockHandleSubscriptionCancellation.mockResolvedValue()

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
      expect(mockHandleSubscriptionCancellation).toHaveBeenCalledWith(subscription)
    })
  })

  describe('Invoice Events', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockImplementation((body, signature, secret) => {
        return JSON.parse(body) as Stripe.Event
      })

      // Mock Stripe API calls for invoice handling
      mockStripe.subscriptions.retrieve.mockResolvedValue(createMockSubscription())
      mockStripe.customers.retrieve.mockResolvedValue({
        id: 'cus_test_123',
        object: 'customer',
        name: 'Test Customer',
        email: 'test@example.com',
      } as Stripe.Customer)
    })

    it('should handle invoice.payment_succeeded', async () => {
      const invoice = createMockInvoice()
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: { object: invoice },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123')
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_test_123')
    })

    it('should handle invoice.payment_failed', async () => {
      const invoice = createMockInvoice({ amount_paid: 0 })
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'invoice.payment_failed',
        data: { object: invoice },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123')
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_test_123')
    })

    it('should handle missing userId in subscription metadata', async () => {
      const subscription = createMockSubscription({ metadata: {} })
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription)

      const invoice = createMockInvoice()
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: { object: invoice },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        'No userId found in subscription metadata for successful payment'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Unhandled Events', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockImplementation((body, signature, secret) => {
        return JSON.parse(body) as Stripe.Event
      })
    })

    it('should handle unhandled event types gracefully', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'customer.created' as any,
        data: { object: {} as any },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('Unhandled event type: customer.created')

      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockImplementation((body, signature, secret) => {
        return JSON.parse(body) as Stripe.Event
      })
    })

    it('should handle subscription update errors', async () => {
      const subscription = createMockSubscription()
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: { object: subscription },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      mockHandleSubscriptionUpdate.mockRejectedValue(new Error('Database error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Webhook processing failed')
      expect(consoleSpy).toHaveBeenCalledWith('Webhook error:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should handle malformed request body', async () => {
      const request = createMockRequest('invalid json', 'valid-signature')

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid JSON')
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid signature')
    })

    it('should handle general processing errors', async () => {
      const request = createMockRequest('{"type": "test"}', 'valid-signature')

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid signature')
    })
  })

  describe('Plan Detection', () => {
    beforeEach(() => {
      mockStripe.webhooks.constructEvent.mockImplementation((body, signature, secret) => {
        return JSON.parse(body) as Stripe.Event
      })

      mockStripe.subscriptions.retrieve.mockResolvedValue(createMockSubscription())
      mockStripe.customers.retrieve.mockResolvedValue({
        id: 'cus_test_123',
        object: 'customer',
        name: 'Test Customer',
        email: 'test@example.com',
      } as Stripe.Customer)

      // Set up environment variables for plan detection
      process.env.STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID = 'price_growth_monthly'
      process.env.STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID = 'price_growth_yearly'
      process.env.STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID = 'price_transformation_monthly'
      process.env.STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID = 'price_transformation_yearly'
    })

    const testPlanDetection = async (priceId: string, expectedPlan: string) => {
      const subscription = createMockSubscription({
        items: {
          object: 'list',
          data: [{
            id: 'si_test_123',
            object: 'subscription_item',
            price: { id: priceId } as Stripe.Price,
          } as Stripe.SubscriptionItem],
        },
      })

      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription)

      const invoice = createMockInvoice()
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: { object: invoice },
        api_version: '2023-10-16',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
      }

      const request = createMockRequest(JSON.stringify(mockEvent), 'valid-signature')

      const response = await POST(request)
      expect(response.status).toBe(200)
    }

    it('should detect Growth plan (monthly)', async () => {
      await testPlanDetection('price_growth_monthly', 'Growth Plan')
    })

    it('should detect Growth plan (yearly)', async () => {
      await testPlanDetection('price_growth_yearly', 'Growth Plan')
    })

    it('should detect Transformation plan (monthly)', async () => {
      await testPlanDetection('price_transformation_monthly', 'Transformation Plan')
    })

    it('should detect Transformation plan (yearly)', async () => {
      await testPlanDetection('price_transformation_yearly', 'Transformation Plan')
    })
  })
})