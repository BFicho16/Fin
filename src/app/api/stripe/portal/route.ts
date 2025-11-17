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

    // Get user's subscription to verify they have one
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    // Create portal session
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
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}


