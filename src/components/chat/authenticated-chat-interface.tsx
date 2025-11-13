'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
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

// Type assertion to fix React 19 type conflicts
const ButtonComponent = Button as any;
const DropdownMenuComponent = DropdownMenu as any;
const DropdownMenuTriggerComponent = DropdownMenuTrigger as any;
const DropdownMenuContentComponent = DropdownMenuContent as any;
const DropdownMenuItemComponent = DropdownMenuItem as any;
const DropdownMenuSeparatorComponent = DropdownMenuSeparator as any;
const MenuIcon = Menu as any;

interface AuthenticatedChatInterfaceProps {
  userId: string;
  userEmail: string;
  threadId?: string;
  onContentOpenChange?: (open: boolean) => void;
}

export default function AuthenticatedChatInterface({ 
  userId, 
  userEmail, 
  threadId, 
  onContentOpenChange 
}: AuthenticatedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentThreadId, setCurrentThreadId] = useState(threadId || `longevity-coach-${userId}`);
  const router = useRouter();
  const supabase = createClient();
  const { overlayState, currentPage, activeTab } = usePageOverlay();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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

  const header = (
    <>
      <div className="flex items-center space-x-2">
        <h3 className="text-xs font-medium">
          Longevity Coach
        </h3>
      </div>
      <DropdownMenuComponent>
        <DropdownMenuTriggerComponent asChild>
          <ButtonComponent variant="ghost" size="icon">
            <MenuIcon className="h-4 w-4" />
          </ButtonComponent>
        </DropdownMenuTriggerComponent>
        <DropdownMenuContentComponent align="end">
          <DropdownMenuItemComponent disabled>
            Settings
          </DropdownMenuItemComponent>
          <DropdownMenuSeparatorComponent />
          <DropdownMenuItemComponent onClick={handleLogout}>
            Logout
          </DropdownMenuItemComponent>
        </DropdownMenuContentComponent>
      </DropdownMenuComponent>
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
    />
  );
}

