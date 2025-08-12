/**
 * API Route: Create Customer Portal Session
 * POST /api/stripe/create-portal-session
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

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
