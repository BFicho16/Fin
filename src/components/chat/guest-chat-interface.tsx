'use client';

import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInterfaceBase } from './chat-interface-base';
import { Message, ChatConfig } from './types';
import { usePageOverlay } from '@/components/page-overlay';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Type assertion to fix React 19 type conflicts
const ButtonComponent = Button as any;

interface GuestChatInterfaceProps {
  guestSessionId: string | null;
  onSessionIdReceived: (sessionId: string) => void;
  progressData: any;
  onContentOpenChange: (open: boolean) => void;
}

export default function GuestChatInterface({ 
  guestSessionId, 
  onSessionIdReceived, 
  progressData, 
  onContentOpenChange
}: GuestChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(guestSessionId);
  const [hasTrackedIntent, setHasTrackedIntent] = useState(false);
  const sessionIdRef = useRef<string | null>(guestSessionId);
  const pathname = usePathname();
  const { overlayState, currentPage } = usePageOverlay();
  const queryClient = useQueryClient();

  // Keep ref in sync with state
  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Create a session immediately on mount if we don't have one
  useEffect(() => {
    if (!currentSessionId) {
      const createSession = async () => {
        try {
          const response = await fetch('/api/chat/guest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: '', // Empty message to just create session
            }),
          });

          if (response.ok) {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.sessionId) {
                        setCurrentSessionId(parsed.sessionId);
                        onSessionIdReceived(parsed.sessionId);
                        return;
                      }
                    } catch (e) {
                      // Ignore parsing errors
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error creating session:', error);
        }
      };

      createSession();
    }
  }, [currentSessionId, onSessionIdReceived]);

  const config: ChatConfig = {
    apiEndpoint: '/api/chat/guest',
    placeholder: 'Share your routine...',
    showTimestamp: false,
    queryClient,
    getMessagePayload: (message: string) => ({
      message,
      guestSessionId: currentSessionId,
      currentPage: currentPage || {
        route: pathname,
        title: 'Onboarding',
        link: pathname,
      },
      overlayState: overlayState || {
        isOpen: false,
        type: null,
      },
    }),
    parseStreamResponse: (parsed: any) => {
      // Handle session ID updates
      if (parsed.sessionId) {
        if (parsed.sessionId !== sessionIdRef.current) {
          console.log('Session ID changed from', sessionIdRef.current, 'to', parsed.sessionId);
          setCurrentSessionId(parsed.sessionId);
          onSessionIdReceived(parsed.sessionId);
        }
        return {}; // Return empty to skip content update
      }
      return { content: parsed.content, error: parsed.error };
    },
    onMessageComplete: async () => {
      // Track onboarding intent on first message
      if (!hasTrackedIntent && typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'OnboardingIntent');
        setHasTrackedIntent(true);
      }
      
      // Invalidate guest progress query to refetch after response
      if (currentSessionId) {
        try {
          queryClient.invalidateQueries({
            queryKey: [['guest']],
          });
        } catch (refreshError) {
          console.error('Error invalidating guest progress query:', refreshError);
        }
      }
    },
  };

  // Extract sleep routine data
  const bedtime = progressData?.sleepRoutine?.night?.bedtime;
  const wakeTime = progressData?.sleepRoutine?.morning?.wake_time;
  const routineItemsCount = progressData?.sleepRoutine?.night?.pre_bed?.length || 0;

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
      </div>
      <div className="flex items-center space-x-2">
        {/* Bedtime button */}
        <ButtonComponent 
          variant="outline"
          size="sm"
          onClick={() => onContentOpenChange(true)}
          className="lg:hidden flex items-center gap-1.5 px-2"
        >
          <Moon className="h-3.5 w-3.5 text-primary" />
          {bedtime && (
            <span className="text-xs">{bedtime}</span>
          )}
        </ButtonComponent>
        {/* Wake-up button */}
        <ButtonComponent 
          variant="outline"
          size="sm"
          onClick={() => onContentOpenChange(true)}
          className="lg:hidden flex items-center gap-1.5 px-2"
        >
          <Sun className="h-3.5 w-3.5 text-primary" />
          {wakeTime && (
            <span className="text-xs">{wakeTime}</span>
          )}
        </ButtonComponent>
        {/* Routine items button */}
        <ButtonComponent 
          variant="outline"
          size="sm"
          onClick={() => onContentOpenChange(true)}
          className="lg:hidden flex items-center gap-1.5 px-2"
        >
          <ClipboardList className="h-3.5 w-3.5 text-primary" />
          {routineItemsCount > 0 && (
            <span className="text-xs font-medium">{routineItemsCount}</span>
          )}
        </ButtonComponent>
        <ButtonComponent 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/login'}
        >
          Log In
        </ButtonComponent>
      </div>
    </>
  );

  const emptyState = (
    <div className="text-center mt-6">
      <div className="flex justify-center mb-4">
        <Image 
          src="/fin-black-square.png" 
          alt="Fin Logo" 
          width={80} 
          height={80} 
          className="h-20 w-20 rounded-3xl"
        />
      </div>
      <p className="text-sm font-bold text-primary mb-2">Longevity Coach Onboarding</p>
      <p className="text-2xl font-medium">What time do you go to bed?</p>
    </div>
  );

  return (
    <ChatInterfaceBase
      config={config}
      header={header}
      emptyState={emptyState}
      initialMessages={messages}
      onMessagesChange={setMessages}
      showFooterHelperText={true}
    />
  );
}

