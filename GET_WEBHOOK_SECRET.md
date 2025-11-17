# Get Your Stripe Webhook Secret

Since you're using **live Stripe keys**, you need to create a webhook endpoint in the Stripe Dashboard and get the signing secret from there.

## Steps:

1. **Go to Stripe Dashboard Webhooks:**
   https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"** (or "Add test endpoint" if testing)

3. **Enter your webhook URL:**
   - For **production**: `https://your-domain.com/api/stripe/webhook`
   - For **local testing**: You can use a tool like ngrok or create a test endpoint

4. **Select these events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. **Click "Add endpoint"**

6. **Get the signing secret:**
   - Click on the webhook endpoint you just created
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

7. **Add to your .env file:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## Alternative: For Local Development

If you want to test locally, you need to:
1. Re-authenticate Stripe CLI: `stripe login`
2. Then run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Copy the `whsec_...` secret from the output


