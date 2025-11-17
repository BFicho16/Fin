# Stripe Integration Setup Guide

This guide explains how to set up Stripe webhooks for both local development and production.

## Prerequisites

1. **Stripe CLI** - Install if not already installed:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Stripe Account** - Make sure you're logged in:
   ```bash
   stripe login
   ```

## Environment Variables

Add these to your `.env` file:

```bash
# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (already configured)
STRIPE_PRICE_ID_MONTHLY=price_1SUWRHA01LapwpJTskRVPyXN
STRIPE_PRICE_ID_WEEKLY=price_1SUWR6A01LapwpJTxoFhK91J

# Webhook Secret (different for local vs production)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Local Development Setup

### Option 1: Using the Setup Script (Recommended)

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run the webhook setup script:
   ```bash
   ./scripts/stripe-webhook-setup.sh
   ```

3. Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### Option 2: Manual Setup

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the Stripe webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Copy the webhook signing secret displayed in the output and add it to your `.env` file

The webhook listener will forward all Stripe events to your local server. Keep this terminal running while developing.

## Production Setup

### 1. Create Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"

### 2. Get Webhook Signing Secret

1. After creating the endpoint, click on it in the webhooks list
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to your production environment variables as `STRIPE_WEBHOOK_SECRET`

### 3. Enable Customer Portal

1. Go to [Stripe Dashboard → Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Click "Activate link" to enable the Customer Portal
3. Configure portal settings:
   - Allow customers to cancel subscriptions: ✅
   - Allow customers to update payment methods: ✅
   - Allow customers to view invoice history: ✅
4. Set the return URL to your app's URL

## Testing Webhooks Locally

You can test webhooks using the Stripe CLI:

```bash
# Test checkout.session.completed event
stripe trigger checkout.session.completed

# Test customer.subscription.created event
stripe trigger customer.subscription.created

# Test invoice.payment_succeeded event
stripe trigger invoice.payment_succeeded
```

## Troubleshooting

### Webhook signature verification fails

- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from your webhook endpoint
- For local development, use the secret from `stripe listen` output
- For production, use the secret from the Stripe Dashboard

### Webhooks not reaching your server

- Check that your webhook endpoint URL is correct
- For local development, make sure `stripe listen` is running
- Check your server logs for errors
- Verify your server is accessible (for production)

### Events not being handled

- Check that you're listening for the correct event types
- Verify your webhook handler code is correct
- Check server logs for processing errors

## Webhook Events Handled

The following Stripe events are handled by the webhook handler:

- `checkout.session.completed` - Creates/updates subscription when checkout completes
- `customer.subscription.created` - Initializes subscription record
- `customer.subscription.updated` - Updates subscription status/plan
- `customer.subscription.deleted` - Marks subscription as canceled
- `invoice.payment_succeeded` - Updates subscription period dates
- `invoice.payment_failed` - Marks subscription as past_due

