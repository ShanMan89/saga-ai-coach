/**
 * API Route: Stripe Webhooks
 * POST /api/stripe/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { 
  handleStripeSubscriptionUpdate,
  handleStripeSubscriptionCancellation 
} from '@/lib/subscription';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing webhook signature or secret' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleStripeSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleStripeSubscriptionCancellation(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleSuccessfulPayment(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleFailedPayment(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata for successful payment');
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    
    // Import email service
    const { emailService } = await import('@/lib/email-service');
    
    // Determine plan name from price ID
    let planName = 'Growth Plan';
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId?.includes('transformation') || priceId === process.env.STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID) {
      planName = 'Transformation Plan';
    } else if (priceId === process.env.STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID) {
      planName = 'Growth Plan';
    }
    
    // Send payment success email
    await emailService.sendPaymentSuccessEmail({
      name: customer.name || 'Valued Customer',
      email: customer.email!,
      amount: invoice.amount_paid,
      planName,
      transactionId: invoice.id,
    });

    // Update user profile with new subscription status
    try {
      const { updateUserSubscription } = await import('@/lib/subscription');
      await updateUserSubscription(userId, {
        tier: planName === 'Transformation Plan' ? 'Transformation' : 'Growth',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      });
    } catch (updateError) {
      console.error('Failed to update user subscription in Firebase:', updateError);
    }

    console.log(`Sent payment success email for user ${userId}, invoice ${invoice.id}`);
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata for failed payment');
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    
    // Import email service
    const { emailService } = await import('@/lib/email-service');
    
    // Determine plan name from price ID
    let planName = 'Growth Plan';
    if (subscription.items.data[0]?.price.id?.includes('transformation')) {
      planName = 'Transformation Plan';
    }
    
    // Send payment failed email
    await emailService.sendPaymentFailedEmail({
      name: customer.name || 'Valued Customer',
      email: customer.email!,
      amount: invoice.amount_due,
      planName,
      transactionId: invoice.id,
    });

    console.log(`Sent payment failed email for user ${userId}, invoice ${invoice.id}`);
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}
