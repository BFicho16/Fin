import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.customer) {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
          const userId = session.metadata?.user_id;

          if (!userId || !subscriptionId) {
            console.error('Missing userId or subscriptionId in checkout.session.completed');
            break;
          }

          // Get subscription details from Stripe
          const stripe = getStripeClient();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_1SUWRHA01LapwpJTskRVPyXN';
          const planType = priceId === monthlyPriceId ? 'monthly' : 'weekly';

          // Update or create subscription record
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subscription.status as any,
              plan_type: planType,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }, {
              onConflict: 'user_id',
            });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

        // Find user by customer ID
        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!existingSub) {
          console.error('No subscription found for customer:', customerId);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY || 'price_1SUWRHA01LapwpJTskRVPyXN';
        const planType = priceId === monthlyPriceId ? 'monthly' : 'weekly';

        await supabase
          .from('user_subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            status: subscription.status as any,
            plan_type: planType,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('user_id', existingSub.user_id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

        if (!subscriptionId) break;

        const stripe = getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!existingSub) break;

        await supabase
          .from('user_subscriptions')
          .update({
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            status: subscription.status as any,
          })
          .eq('user_id', existingSub.user_id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

        if (!subscriptionId) break;

        const stripe = getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!existingSub) break;

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('user_id', existingSub.user_id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

