/**
 * API Route: Get User Subscription
 * GET /api/stripe/subscription?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { authAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    if (!authAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await authAdmin.verifyIdToken(token);
    } catch (authError) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Ensure user can only access their own subscription data
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Can only access your own subscription' },
        { status: 403 }
      );
    }

    // Find customer by userId in metadata
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

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const subscription = subscriptions.data[0];
    const price = subscription.items.data[0].price;

    // Determine tier based on price ID
    let tier: 'Explorer' | 'Growth' | 'Transformation' = 'Explorer';
    let billing: 'monthly' | 'yearly' = 'monthly';

    if (price.id === process.env.STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID) {
      tier = 'Growth';
      billing = 'monthly';
    } else if (price.id === process.env.STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID) {
      tier = 'Growth';
      billing = 'yearly';
    } else if (price.id === process.env.STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID) {
      tier = 'Transformation';
      billing = 'monthly';
    } else if (price.id === process.env.STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID) {
      tier = 'Transformation';
      billing = 'yearly';
    }

    return NextResponse.json({
      tier,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      billing,
      customerId: customer.id,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
