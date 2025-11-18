import { Database } from '@/lib/database.types';

export type SubscriptionRow = Database['public']['Tables']['user_subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['user_subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['user_subscriptions']['Update'];

export type SubscriptionStatus = SubscriptionRow['status'];
export type PlanType = SubscriptionRow['plan_type'];



