'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInterfaceBase } from './chat-interface-base';
import { Message, ChatConfig } from './types';
import { usePageOverlay } from '@/components/page-overlay';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/trpc-client';
import { useToast } from '@/components/ui/toast';

// Type assertion to fix React 19 type conflicts
const ButtonComponent = Button as any;
const DropdownMenuComponent = DropdownMenu as any;
const DropdownMenuTriggerComponent = DropdownMenuTrigger as any;
const DropdownMenuContentComponent = DropdownMenuContent as any;
const DropdownMenuItemComponent = DropdownMenuItem as any;
const DropdownMenuSeparatorComponent = DropdownMenuSeparator as any;
const MenuIcon = Menu as any;
const ClipboardListIcon = ClipboardList as any;

interface AuthenticatedChatInterfaceProps {
  userId: string;
  userEmail: string;
  threadId?: string;
  onContentOpenChange?: (open: boolean) => void;
}

function AuthenticatedChatInterfaceContent({ 
  userId, 
  userEmail, 
  threadId, 
  onContentOpenChange 
}: AuthenticatedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentThreadId, setCurrentThreadId] = useState(threadId || `longevity-coach-${userId}`);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { overlayState, currentPage, activeTab, setActiveTab } = usePageOverlay();
  const pathname = usePathname();
  const { showToast } = useToast();

  // Query subscription status
  const { data: subscription, isLoading: isLoadingSubscription } = api.subscription.getSubscription.useQuery();
  const portalMutation = api.subscription.getCustomerPortalUrl.useMutation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSubscriptionClick = async () => {
    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
      // No subscription or not active - open upgrade modal
      router.push('/?upgrade=true');
    } else {
      // Has active subscription - open customer portal
      try {
        const result = await portalMutation.mutateAsync();
        if (result.url) {
          window.location.href = result.url;
        }
      } catch (error) {
        console.error('Error opening customer portal:', error);
        showToast({
          title: 'Error',
          description: 'Failed to open subscription management. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch('/api/chat/history');
        if (response.ok) {
          const data = await response.json();
          // Convert timestamp strings back to Date objects
          const messagesWithDates = (data.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(messagesWithDates);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [userId]);

  const config: ChatConfig = {
    apiEndpoint: '/api/chat',
    placeholder: 'Tell me about your routine and habits...',
    showTimestamp: true,
    queryClient,
    userId,
    getMessagePayload: (message: string) => {
      // If on root route, ensure activeTab is included in metadata
      let pageMetadata = currentPage;
      if (pathname === '/') {
        pageMetadata = {
          route: pathname,
          title: 'Home',
          link: pathname,
          metadata: {
            ...(currentPage?.metadata || {}),
            activeTab,
          },
        };
      }
      return {
        message,
        threadId: currentThreadId,
        currentPage: pageMetadata || {
          route: pathname,
          title: 'Home',
          link: pathname,
        },
        overlayState: overlayState,
      };
    },
  };

  const handleRoutineClick = () => {
    setActiveTab('my-routine');
    if (onContentOpenChange) {
      onContentOpenChange(true);
    }
  };

  const header = (
    <>
      <div className="flex items-center space-x-2">
        <Image 
          src="/fin-transparent.png" 
          alt="Fin Logo" 
          width={24} 
          height={24} 
          className="h-5 w-5 rounded-lg"
        />
        <h3 className="text-xs font-medium">
          Longevity Coach
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <ButtonComponent 
          variant="outline"
          size="sm"
          onClick={handleRoutineClick}
        >
          <ClipboardListIcon className="h-3.5 w-3.5 mr-1 text-primary" />
          My Routine
        </ButtonComponent>
        <DropdownMenuComponent>
          <DropdownMenuTriggerComponent asChild>
            <ButtonComponent variant="ghost" size="icon">
              <MenuIcon className="h-4 w-4" />
            </ButtonComponent>
          </DropdownMenuTriggerComponent>
          <DropdownMenuContentComponent align="end">
            {!isLoadingSubscription && (
              <DropdownMenuItemComponent
                onClick={handleSubscriptionClick}
                disabled={portalMutation.isPending}
              >
                {subscription && (subscription.status === 'active' || subscription.status === 'trialing')
                  ? 'Manage Subscription'
                  : 'Fin Pro'}
              </DropdownMenuItemComponent>
            )}
            <DropdownMenuItemComponent disabled>
              Settings
            </DropdownMenuItemComponent>
            <DropdownMenuSeparatorComponent />
            <DropdownMenuItemComponent onClick={handleLogout}>
              Logout
            </DropdownMenuItemComponent>
          </DropdownMenuContentComponent>
        </DropdownMenuComponent>
      </div>
    </>
  );

  const emptyState = isLoadingHistory ? (
    <div className="text-center text-muted-foreground mt-6">
      <div className="flex items-center justify-center space-x-1.5">
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-3 h-3 rounded-full" />
      </div>
      <p className="text-xs mt-1.5">Loading your chat history...</p>
    </div>
  ) : (
    <div className="text-center mt-6">
      <p className="text-sm font-bold text-primary mb-2">Longevity Coach</p>
      <p className="text-2xl font-medium">Share updates to your routine or habits and I&apos;ll make suggestions</p>
    </div>
  );

  return (
    <ChatInterfaceBase
      config={config}
      header={header}
      emptyState={emptyState}
      initialMessages={messages}
      onMessagesChange={(newMessages) => {
        // Ensure we have a thread ID for future messages
        if (!currentThreadId && newMessages.length > 0) {
          setCurrentThreadId(`longevity-coach-${userId}`);
        }
      }}
      // Upgrade bar is now handled internally by ChatInterfaceBase
      // No need for onUpgradeRequired callback - the bar will handle opening the modal
    />
  );
}

export default function AuthenticatedChatInterface(props: AuthenticatedChatInterfaceProps) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedChatInterfaceContent {...props} />
    </Suspense>
  );
}

