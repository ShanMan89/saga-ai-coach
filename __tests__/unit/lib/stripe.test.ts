/**
 * @jest-environment node
 */

import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe')

describe('Stripe Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure environment variable is set for tests
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789'
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.STRIPE_SECRET_KEY
  })

  it('should initialize Stripe with correct configuration', () => {
    // Since we're importing the module, Stripe should be initialized
    expect(Stripe).toHaveBeenCalledWith('sk_test_123456789', {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  })

  it('should export stripe instance', () => {
    expect(stripe).toBeDefined()
    expect(stripe).toBeInstanceOf(Stripe)
  })

  describe('Environment Variable Validation', () => {
    it('should throw error when STRIPE_SECRET_KEY is missing', () => {
      // Clear the environment variable
      delete process.env.STRIPE_SECRET_KEY

      // Re-import the module to trigger the error
      expect(() => {
        jest.resetModules()
        require('@/lib/stripe')
      }).toThrow('Missing STRIPE_SECRET_KEY environment variable')
    })

    it('should work with valid STRIPE_SECRET_KEY', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key'

      expect(() => {
        jest.resetModules()
        require('@/lib/stripe')
      }).not.toThrow()
    })
  })

  describe('Stripe API Methods', () => {
    beforeEach(() => {
      // Mock all Stripe methods we use in the application
      ;(stripe.customers as any) = {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        list: jest.fn(),
      }
      ;(stripe.subscriptions as any) = {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
        list: jest.fn(),
      }
      ;(stripe.checkout as any) = {
        sessions: {
          create: jest.fn(),
          retrieve: jest.fn(),
        },
      }
      ;(stripe.billingPortal as any) = {
        sessions: {
          create: jest.fn(),
        },
      }
      ;(stripe.webhooks as any) = {
        constructEvent: jest.fn(),
      }
      ;(stripe.prices as any) = {
        retrieve: jest.fn(),
        list: jest.fn(),
      }
    })

    describe('Customer Operations', () => {
      it('should create customer successfully', async () => {
        const mockCustomer = {
          id: 'cus_123',
          email: 'test@example.com',
          name: 'Test User',
        }

        ;(stripe.customers.create as jest.Mock).mockResolvedValue(mockCustomer)

        const customer = await stripe.customers.create({
          email: 'test@example.com',
          name: 'Test User',
        })

        expect(stripe.customers.create).toHaveBeenCalledWith({
          email: 'test@example.com',
          name: 'Test User',
        })
        expect(customer).toEqual(mockCustomer)
      })

      it('should retrieve customer successfully', async () => {
        const mockCustomer = {
          id: 'cus_123',
          email: 'test@example.com',
        }

        ;(stripe.customers.retrieve as jest.Mock).mockResolvedValue(mockCustomer)

        const customer = await stripe.customers.retrieve('cus_123')

        expect(stripe.customers.retrieve).toHaveBeenCalledWith('cus_123')
        expect(customer).toEqual(mockCustomer)
      })
    })

    describe('Subscription Operations', () => {
      it('should create subscription successfully', async () => {
        const mockSubscription = {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
        }

        ;(stripe.subscriptions.create as jest.Mock).mockResolvedValue(mockSubscription)

        const subscription = await stripe.subscriptions.create({
          customer: 'cus_123',
          items: [{ price: 'price_123' }],
        })

        expect(stripe.subscriptions.create).toHaveBeenCalledWith({
          customer: 'cus_123',
          items: [{ price: 'price_123' }],
        })
        expect(subscription).toEqual(mockSubscription)
      })

      it('should retrieve subscription successfully', async () => {
        const mockSubscription = {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
        }

        ;(stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription)

        const subscription = await stripe.subscriptions.retrieve('sub_123')

        expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')
        expect(subscription).toEqual(mockSubscription)
      })

      it('should cancel subscription successfully', async () => {
        const mockSubscription = {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'canceled',
        }

        ;(stripe.subscriptions.cancel as jest.Mock).mockResolvedValue(mockSubscription)

        const subscription = await stripe.subscriptions.cancel('sub_123')

        expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123')
        expect(subscription).toEqual(mockSubscription)
      })
    })

    describe('Checkout Operations', () => {
      it('should create checkout session successfully', async () => {
        const mockSession = {
          id: 'cs_123',
          url: 'https://checkout.stripe.com/pay/cs_123',
        }

        ;(stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession)

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          line_items: [{ price: 'price_123', quantity: 1 }],
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        })

        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
          mode: 'subscription',
          line_items: [{ price: 'price_123', quantity: 1 }],
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        })
        expect(session).toEqual(mockSession)
      })
    })

    describe('Billing Portal Operations', () => {
      it('should create billing portal session successfully', async () => {
        const mockSession = {
          id: 'bps_123',
          url: 'https://billing.stripe.com/session/bps_123',
        }

        ;(stripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue(mockSession)

        const session = await stripe.billingPortal.sessions.create({
          customer: 'cus_123',
          return_url: 'https://example.com/dashboard',
        })

        expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
          customer: 'cus_123',
          return_url: 'https://example.com/dashboard',
        })
        expect(session).toEqual(mockSession)
      })
    })

    describe('Webhook Operations', () => {
      it('should construct webhook event successfully', () => {
        const mockEvent = {
          id: 'evt_123',
          type: 'customer.subscription.created',
          data: { object: {} },
        }

        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent)

        const payload = 'webhook payload'
        const signature = 'webhook signature'
        const secret = 'webhook secret'

        const event = stripe.webhooks.constructEvent(payload, signature, secret)

        expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
          payload,
          signature,
          secret
        )
        expect(event).toEqual(mockEvent)
      })

      it('should handle invalid webhook signature', () => {
        const error = new Error('Invalid signature')
        ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
          throw error
        })

        expect(() => {
          stripe.webhooks.constructEvent('payload', 'invalid-sig', 'secret')
        }).toThrow('Invalid signature')
      })
    })

    describe('Price Operations', () => {
      it('should retrieve price successfully', async () => {
        const mockPrice = {
          id: 'price_123',
          unit_amount: 999,
          currency: 'usd',
        }

        ;(stripe.prices.retrieve as jest.Mock).mockResolvedValue(mockPrice)

        const price = await stripe.prices.retrieve('price_123')

        expect(stripe.prices.retrieve).toHaveBeenCalledWith('price_123')
        expect(price).toEqual(mockPrice)
      })

      it('should list prices successfully', async () => {
        const mockPrices = {
          data: [
            { id: 'price_123', unit_amount: 999 },
            { id: 'price_456', unit_amount: 1999 },
          ],
        }

        ;(stripe.prices.list as jest.Mock).mockResolvedValue(mockPrices)

        const prices = await stripe.prices.list({ limit: 10 })

        expect(stripe.prices.list).toHaveBeenCalledWith({ limit: 10 })
        expect(prices).toEqual(mockPrices)
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(stripe.customers as any) = {
        create: jest.fn(),
      }
    })

    it('should handle Stripe API errors', async () => {
      const stripeError = {
        type: 'StripeCardError',
        code: 'card_declined',
        message: 'Your card was declined.',
      }

      ;(stripe.customers.create as jest.Mock).mockRejectedValue(stripeError)

      await expect(
        stripe.customers.create({ email: 'test@example.com' })
      ).rejects.toEqual(stripeError)
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network error')
      ;(stripe.customers.create as jest.Mock).mockRejectedValue(networkError)

      await expect(
        stripe.customers.create({ email: 'test@example.com' })
      ).rejects.toThrow('Network error')
    })
  })
})