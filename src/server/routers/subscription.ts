import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/server';

// Validate price IDs at runtime
// Check both server-side and client-side env vars (NEXT_PUBLIC_ versions work for both)
const getValidPriceIds = () => {
  const monthly = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_1SUWRHA01LapwpJTskRVPyXN';
  const weekly = process.env.STRIPE_PRICE_ID_WEEKLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_WEEKLY || 'price_1SUWR6A01LapwpJTxoFhK91J';
  return [monthly, weekly] as [string, string];
};

const priceIdSchema = z.string().refine(
  (val) => {
    const validIds = getValidPriceIds();
    return validIds.includes(val);
  },
  { message: 'Invalid price ID' }
);

export const subscriptionRouter = router({
  getSubscription: publicProcedure.query(async () => {
    try {
      const supabase = await createClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no rows found, return null (not an error)
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Subscription query error:', error);
        throw new Error(`Failed to fetch subscription: ${error.message}`);
      }

      return subscription;
    } catch (error) {
      console.error('Error in getSubscription:', error);
      throw error;
    }
  }),

  getCheckoutSession: publicProcedure
    .input(
      z.object({
        priceId: priceIdSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = await createClient();
      const stripe = getStripeClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

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
        const validIds = getValidPriceIds();
        const planType = input.priceId === validIds[0] ? 'monthly' : 'weekly';
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
      // Use origin from context if available (from request headers), otherwise fall back to env var
      const origin = ctx.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: input.priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/?subscription=success`,
        cancel_url: `${origin}/?upgrade=true&subscription=canceled`,
        metadata: {
          user_id: user.id,
        },
      });

      return { url: session.url };
    }),

  getCustomerPortalUrl: publicProcedure.mutation(async ({ ctx }) => {
    const supabase = await createClient();
    const stripe = getStripeClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get user's subscription to verify they have one
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      throw new Error('Subscription is not active');
    }

    // Create portal session
    // Use origin from context if available (from request headers), otherwise fall back to env var
    const origin = ctx.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/`,
    });

    return { url: session.url };
  }),
});

