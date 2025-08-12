
'use server';

/**
 * @fileOverview A Genkit flow for creating a Stripe Checkout session.
 *
 * - createCheckoutSession - A function that creates and returns a Stripe Checkout session URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import Stripe from 'stripe';
import type { SubscriptionTierType } from '@/lib/types';


const priceIds: Record<SubscriptionTierType, string> = {
    "Growth": process.env.STRIPE_GROWTH_PLAN_PRICE_ID || '',
    "Transformation": process.env.STRIPE_TRANSFORMATION_PLAN_PRICE_ID || '',
    "Explorer": '' // No price for free plan
};

const CreateCheckoutSessionInputSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  tier: z.enum(["Growth", "Transformation"]),
  origin: z.string().url(),
});
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionInputSchema>;

const CreateCheckoutSessionOutputSchema = z.object({
  sessionId: z.string(),
  url: z.string().url(),
});
export type CreateCheckoutSessionOutput = z.infer<typeof CreateCheckoutSessionOutputSchema>;

export const createCheckoutSession = ai.defineFlow(
  {
    name: 'createCheckoutSession',
    actionType: 'flow',
    inputSchema: CreateCheckoutSessionInputSchema,
    outputSchema: CreateCheckoutSessionOutputSchema,
  },
  async ({ userId, userEmail, tier, origin }: CreateCheckoutSessionInput) => {
    
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error('Stripe secret key is not set in environment variables');
    }
    const stripe = new Stripe(stripeSecret);

    const priceId = priceIds[tier as keyof typeof priceIds];
    if (!priceId) {
      throw new Error(`Invalid tier or missing price ID for: ${tier}`);
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/profile`,
        customer_email: userEmail,
        client_reference_id: userId,
        // When the subscription is created, we'll get a webhook event.
        // The `client_reference_id` will be used to link the Stripe customer to the Firebase user.
        subscription_data: {
            metadata: {
                firebase_uid: userId,
                tier: tier
            }
        }
      });

      if (!session.url) {
        throw new Error('Stripe session URL not found');
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error: any) {
      console.error('Stripe Error:', error.message);
      throw new Error('Failed to create Stripe checkout session.');
    }
  }
);
