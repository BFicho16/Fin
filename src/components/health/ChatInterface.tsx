'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Menu, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageContent } from './MessageContent';
import { useMobileKeyboard } from '@/lib/hooks/useMobileKeyboard';

// Type assertion to fix React 19 type conflicts
const CardComponent = Card as any;
const CardHeaderComponent = CardHeader as any;
const CardContentComponent = CardContent as any;
const CardFooterComponent = CardFooter as any;
const ButtonComponent = Button as any;
const TextareaComponent = Textarea as any;
const DropdownMenuComponent = DropdownMenu as any;
const DropdownMenuTriggerComponent = DropdownMenuTrigger as any;
const DropdownMenuContentComponent = DropdownMenuContent as any;
const DropdownMenuItemComponent = DropdownMenuItem as any;
const DropdownMenuSeparatorComponent = DropdownMenuSeparator as any;
const MenuIcon = Menu as any;
const UserIcon = User as any;
const BotIcon = Bot as any;
const SendIcon = Send as any;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  userId: string;
  userEmail: string;
  threadId?: string;
  isTrackerOpen?: boolean;
  onTrackerOpenChange?: (open: boolean) => void;
}

export default function ChatInterface({ userId, userEmail, threadId, isTrackerOpen = false, onTrackerOpenChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(threadId || `longevity-coach-${userId}`);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { isKeyboardOpen } = useMobileKeyboard();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    let assistantMessage: Message | null = null;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          threadId: currentThreadId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage!]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage!.id 
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              } else if (parsed.error) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage!.id 
                      ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                      : msg
                  )
                );
                setIsLoading(false);
                return;
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      // Ensure we have a thread ID for future messages
      if (!currentThreadId) {
        setCurrentThreadId(`longevity-coach-${userId}`);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      if (assistantMessage) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage!.id 
              ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <CardComponent className={`flex flex-col h-full overflow-hidden max-h-full ${isKeyboardOpen ? 'mobile-keyboard-open' : 'mobile-keyboard-aware'}`}>
      {/* Consolidated Header */}
      <div className="py-1.5 px-3 flex-shrink-0 border-b bg-background/95 rounded-t-lg">
        <div className="flex items-center justify-between">
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
        </div>
      </div>


      {/* Messages */}
      <CardContentComponent ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {isLoadingHistory ? (
          <div className="text-center text-muted-foreground mt-6">
            <div className="flex items-center justify-center space-x-1.5">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="w-3 h-3 rounded-full" />
            </div>
            <p className="text-xs mt-1.5">Loading your chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center mt-6">
            <p className="text-sm font-bold text-primary mb-2">Longevity Coach</p>
            <p className="text-2xl font-medium">Share updates to your routine or habits and I'll make suggestions</p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <CardComponent className={`max-w-xs lg:max-w-md ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}>
              <CardContentComponent className="p-2">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  {message.role === 'user' ? (
                    <UserIcon className="h-3.5 w-3.5" />
                  ) : (
                    <BotIcon className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[10px] opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <MessageContent content={message.content} />
              </CardContentComponent>
            </CardComponent>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <CardComponent className="bg-muted">
              <CardContentComponent className="p-2">
                <div className="flex items-center space-x-1.5">
                  <BotIcon className="h-3.5 w-3.5" />
                  <div className="flex space-x-0.5">
                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                  </div>
                </div>
              </CardContentComponent>
            </CardComponent>
          </div>
        )}
      </CardContentComponent>

      {/* Input */}
      <CardFooterComponent className="pt-2 flex-shrink-0">
        <div className="flex space-x-1.5 w-full">
          <TextareaComponent
            ref={textareaRef}
            value={inputMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setInputMessage(e.target.value);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your routine and habits..."
            className="flex-1 resize-none overflow-hidden"
            rows={1}
            disabled={isLoading}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <ButtonComponent
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="shrink-0 self-end h-10 w-10"
          >
            <SendIcon className="h-3.5 w-3.5" />
          </ButtonComponent>
        </div>
      </CardFooterComponent>
    </CardComponent>
  );
}
