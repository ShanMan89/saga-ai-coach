/**
 * API Route: Create Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getPromoCodeByCode, createStripeCouponFromPromoCode, applyPromoCode } from '@/lib/promo-codes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, userId, customerEmail, successUrl, cancelUrl, promoCode } = body;

    // Validate required fields
    if (!priceId || !userId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId, customerEmail' },
        { status: 400 }
      );
    }

    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: userId,
        },
      });
    }

    // Handle promo code if provided
    let discountOptions: any = {};
    if (promoCode) {
      const promoCodeData = getPromoCodeByCode(promoCode);
      if (promoCodeData) {
        try {
          // Create or get existing Stripe coupon
          let stripeCoupon;
          try {
            stripeCoupon = await stripe.coupons.retrieve(promoCode.toLowerCase());
          } catch (error) {
            // Coupon doesn't exist, create it
            const couponData = createStripeCouponFromPromoCode(promoCodeData);
            stripeCoupon = await stripe.coupons.create(couponData);
          }
          
          discountOptions = {
            discounts: [{
              coupon: stripeCoupon.id
            }]
          };
          
          // Apply the promo code (increment usage)
          applyPromoCode(promoCode);
        } catch (couponError) {
          console.error('Error creating/applying coupon:', couponError);
          // Continue without discount if coupon creation fails
        }
      }
    }

    // Create checkout session
    const sessionConfig: any = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: userId,
        ...(promoCode && { promoCode })
      },
      subscription_data: {
        metadata: {
          userId: userId,
          ...(promoCode && { promoCode })
        },
        ...discountOptions
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    // Add discounts to session if we have them
    if (discountOptions.discounts) {
      sessionConfig.discounts = discountOptions.discounts;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
