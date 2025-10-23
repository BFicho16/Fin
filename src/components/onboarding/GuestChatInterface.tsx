'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageContent } from '@/components/health/MessageContent';
import SuggestedMessagesList from './SuggestedMessagesList';

// Type assertion to fix React 19 type conflicts
const CardComponent = Card as any;
const CardHeaderComponent = CardHeader as any;
const CardContentComponent = CardContent as any;
const CardFooterComponent = CardFooter as any;
const ButtonComponent = Button as any;
const TextareaComponent = Textarea as any;
const UserIcon = User as any;
const BotIcon = Bot as any;
const SendIcon = Send as any;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GuestChatInterfaceProps {
  guestSessionId: string | null;
  onSessionIdReceived: (sessionId: string) => void;
  progressData: any;
}

export default function GuestChatInterface({ guestSessionId, onSessionIdReceived, progressData }: GuestChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(guestSessionId);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSuggestedMessages, setShowSuggestedMessages] = useState(true);
  const [isDelayingSuggestedMessages, setIsDelayingSuggestedMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Re-show suggested messages when progress updates (but not if we're delaying)
  useEffect(() => {
    if (progressData && !isDelayingSuggestedMessages) {
      setShowSuggestedMessages(true);
    }
  }, [progressData, isDelayingSuggestedMessages]);

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
      const response = await fetch('/api/chat/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          guestSessionId: currentSessionId,
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
              if (parsed.sessionId) {
                // Always update session ID if it's different (handles new session creation)
                if (parsed.sessionId !== currentSessionId) {
                  console.log('Session ID changed from', currentSessionId, 'to', parsed.sessionId);
                  setCurrentSessionId(parsed.sessionId);
                  onSessionIdReceived(parsed.sessionId);
                }
              } else if (parsed.content) {
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

  const handleSuggestedMessageSelect = (message: string) => {
    setInputMessage(message);
    setShowSuggestedMessages(false);
    setIsDelayingSuggestedMessages(true);
    
    // Re-enable suggested messages after 5 seconds
    setTimeout(() => {
      setIsDelayingSuggestedMessages(false);
      setShowSuggestedMessages(true);
    }, 10000);
  };

  const handleSuggestedMessagesDismiss = () => {
    setShowSuggestedMessages(false);
  };

  return (
    <CardComponent className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header */}
      <div className="py-1.5 px-3 flex-shrink-0 border-b bg-background/95 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-medium">Onboarding Interview</h3>
          </div>
          <ButtonComponent 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/login'}
          >
            Log In
          </ButtonComponent>
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
          <div className="text-center text-muted-foreground mt-6">
            <BotIcon className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Welcome! Let's get to know you better.</p>
            <p className="text-xs mt-1.5">
              I&apos;m here to learn about your current lifestyle, habits, and preferences. 
              This will help me create personalized routines that match your actual daily patterns.
              Let&apos;s start with some basic information about you!
            </p>
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

      {/* Suggested Messages */}
      {showSuggestedMessages && progressData && !isDelayingSuggestedMessages && (
        <div className="px-4 pt-2 flex-shrink-0">
          <SuggestedMessagesList
            progressData={progressData}
            onMessageSelect={handleSuggestedMessageSelect}
            onDismiss={handleSuggestedMessagesDismiss}
          />
        </div>
      )}

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
            placeholder="Tell me about yourself and your habits..."
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
