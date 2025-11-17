'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Check, Circle } from 'lucide-react';
import { api } from '@/lib/trpc-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

interface UpgradeModalProps {
  userId: string;
}

// Price IDs are public and safe to expose on client
// Use environment variables with fallback to default values
const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_1SUWRHA01LapwpJTskRVPyXN';
const WEEKLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_WEEKLY || 'price_1SUYSiA01LapwpJTlwcSRtg9';

function UpgradeModalContent({ userId }: UpgradeModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'weekly'>('monthly');
  const { showToast } = useToast();
  const checkoutMutation = api.subscription.getCheckoutSession.useMutation();

  useEffect(() => {
    const upgradeParam = searchParams.get('upgrade');
    setIsOpen(upgradeParam === 'true');
  }, [searchParams]);

  useEffect(() => {
    // Handle success/cancel from Stripe redirect
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      showToast({
        title: 'Subscription successful!',
        description: 'Welcome to Fin Pro. Your subscription is now active.',
        variant: 'success',
      });
    } else if (subscriptionStatus === 'canceled') {
      showToast({
        title: 'Subscription canceled',
        description: 'You can try again anytime.',
        variant: 'default',
      });
    }
  }, [searchParams, showToast]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Remove upgrade param when closing, but keep other params
      const params = new URLSearchParams(searchParams.toString());
      params.delete('upgrade');
      params.delete('subscription'); // Also clean up subscription status params
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl);
    }
  };

  const handleUpgrade = async () => {
    try {
      const priceId = selectedPlan === 'monthly' ? MONTHLY_PRICE_ID : WEEKLY_PRICE_ID;
      
      const result = await checkoutMutation.mutateAsync({ priceId });
      
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      showToast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogTitle className="sr-only">Upgrade to Pro</DialogTitle>
        <DialogDescription className="sr-only">
          Choose a subscription plan to unlock advanced features and personalized AI coaching
        </DialogDescription>
        {/* Complete wrapper that isolates from DialogContent's grid layout */}
        <div 
          className="flex flex-col h-full max-h-[90vh] overflow-hidden"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Header row with logo */}
          <div className="flex items-center px-6 md:px-8 pt-6 md:pt-8 flex-shrink-0">
            <Image 
              src="/fin-transparent.png" 
              alt="Fin Logo" 
              width={32} 
              height={32} 
            />
          </div>
          {/* Scrollable content area with explicit spacing */}
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-6 md:px-8 pb-6 md:pb-8">
            <div className="flex flex-col w-full">
              {/* Hero text */}
              <p className="text-3xl font-semibold text-left my-4">
                Your body is decaying, start fighting back
              </p>
              <p className="text-muted-foreground text-left mb-4 text-lg">
                Your Fin Longevity Coach will analyze your routine, make suggestions based on the latest research, and work with you to track the impact.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedPlan === 'weekly'
                      ? 'border-2 bg-primary/10'
                      : 'border hover:border-primary/50'
                  }`}
                  style={selectedPlan === 'weekly' ? { borderColor: 'hsl(var(--primary))' } : undefined}
                  onClick={() => setSelectedPlan('weekly')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Weekly</CardTitle>
                      {selectedPlan === 'weekly' ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">$8</span>
                      <span className="text-muted-foreground">/week</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Billed weekly, cancel anytime
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedPlan === 'monthly'
                      ? 'border-2 bg-primary/10'
                      : 'border hover:border-primary/50'
                  }`}
                  style={selectedPlan === 'monthly' ? { borderColor: 'hsl(var(--primary))' } : undefined}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Monthly</CardTitle>
                      {selectedPlan === 'monthly' ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">$20</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Billed monthly, cancel anytime
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex mb-4">
                <Button
                  onClick={handleUpgrade}
                  disabled={checkoutMutation.isPending}
                  size="lg"
                  className="w-full text-lg py-6"
                >
                  {checkoutMutation.isPending ? 'Processing...' : 'Upgrade to Pro'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UpgradeModal({ userId }: UpgradeModalProps) {
  return (
    <Suspense fallback={null}>
      <UpgradeModalContent userId={userId} />
    </Suspense>
  );
}

