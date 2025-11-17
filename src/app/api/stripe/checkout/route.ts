import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    // Validate priceId - check both server-side and client-side env vars
    const getValidPriceIds = () => {
      const monthly = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_1SUWRHA01LapwpJTskRVPyXN';
      const weekly = process.env.STRIPE_PRICE_ID_WEEKLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_WEEKLY || 'price_1SUWR6A01LapwpJTxoFhK91J';
      return [monthly, weekly];
    };
    const validPriceIds = getValidPriceIds();

    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 });
    }

    const stripe = getStripeClient();

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId: string;

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Store customer ID in database (subscription will be created via webhook)
      const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_1SUWRHA01LapwpJTskRVPyXN';
      const planType = priceId === monthlyPriceId ? 'monthly' : 'weekly';
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: 'incomplete',
          plan_type: planType,
        }, {
          onConflict: 'user_id',
        });
    }

    // Create checkout session
    // Get origin from request headers, with fallback to x-forwarded-host for production behind load balancers
    let origin = request.headers.get('origin');
    if (!origin) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      if (forwardedHost) {
        origin = `https://${forwardedHost}`;
      } else {
        origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      }
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?subscription=success`,
      cancel_url: `${origin}/?upgrade=true&subscription=canceled`,
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

