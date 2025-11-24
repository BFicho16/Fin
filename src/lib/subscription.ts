import { SubscriptionRow } from '@/types/subscription';

/**
 * Check if a user has an active Pro subscription
 * @param subscription - The subscription object from the database, or null if no subscription exists
 * @returns true if user has active or trialing subscription, false otherwise
 */
export function isProUser(subscription: SubscriptionRow | null): boolean {
  if (!subscription) {
    return false;
  }
  
  return subscription.status === 'active' || subscription.status === 'trialing';
}





