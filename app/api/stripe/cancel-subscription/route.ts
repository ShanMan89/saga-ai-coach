/**
 * API Route: Cancel User Subscription
 * POST /api/stripe/cancel-subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Find customer by userId
    const customers = await stripe.customers.list({
      limit: 100,
    });

    const customer = customers.data.find(
      (cust) => cust.metadata?.userId === userId
    );

    if (!customer) {
      return NextResponse.json(
        { error: 'No customer found for this user' },
        { status: 404 }
      );
    }

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 404 }
      );
    }

    const subscription = subscriptions.data[0];

    // Cancel the subscription at period end (don't cancel immediately)
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: canceledSubscription.id,
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000),
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
