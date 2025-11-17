'use client';

import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from 'react';
import { Send, User, Bot } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { MessageContent } from './message-content';
import { useMobileKeyboard } from '@/lib/hooks/use-mobile-keyboard';
import { Message, ChatConfig } from './types';

// Type assertion to fix React 19 type conflicts
const CardComponent = Card as any;
const CardContentComponent = CardContent as any;
const CardFooterComponent = CardFooter as any;
const ButtonComponent = Button as any;
const TextareaComponent = Textarea as any;
const UserIcon = User as any;
const BotIcon = Bot as any;
const SendIcon = Send as any;
const InputGroupComponent = InputGroup as any;
const InputGroupAddonComponent = InputGroupAddon as any;
const InputGroupButtonComponent = InputGroupButton as any;
const InputGroupTextareaComponent = InputGroupTextarea as any;

interface ChatInterfaceBaseProps {
  config: ChatConfig;
  header: ReactNode;
  emptyState?: ReactNode;
  initialMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
  onUpgradeRequired?: () => void;
  className?: string;
}

export function ChatInterfaceBase({
  config,
  header,
  emptyState,
  initialMessages = [],
  onMessagesChange,
  onUpgradeRequired,
  className = '',
}: ChatInterfaceBaseProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousMessagesRef = useRef<Message[]>(initialMessages);
  const previousInitialMessagesRef = useRef<Message[]>(initialMessages);
  const isInitialMountRef = useRef(true);
  const { isKeyboardOpen } = useMobileKeyboard();

  // Log when textarea ref is set and monitor for style changes
  useEffect(() => {
    if (textareaRef.current) {
      console.log('[TEXTAREA] Ref attached on mount', {
        element: textareaRef.current,
        initialHeight: textareaRef.current.style.height,
        initialScrollHeight: textareaRef.current.scrollHeight,
        initialOffsetHeight: textareaRef.current.offsetHeight,
        initialClientHeight: textareaRef.current.clientHeight,
        computedHeight: window.getComputedStyle(textareaRef.current).height,
        computedMinHeight: window.getComputedStyle(textareaRef.current).minHeight,
        className: textareaRef.current.className,
      });

      // Monitor for style attribute changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            console.log('[TEXTAREA] Style attribute changed', {
              newStyle: textareaRef.current?.getAttribute('style'),
              height: textareaRef.current?.style.height,
              stackTrace: new Error().stack,
            });
          }
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            console.log('[TEXTAREA] Class attribute changed', {
              newClass: textareaRef.current?.className,
              height: textareaRef.current?.style.height,
            });
          }
        });
      });

      observer.observe(textareaRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Only call onMessagesChange when messages actually change (not just when function reference changes)
  useEffect(() => {
    if (onMessagesChange) {
      // Deep comparison: check if messages array has actually changed
      const hasChanged = 
        previousMessagesRef.current.length !== messages.length ||
        previousMessagesRef.current.some((prevMsg, index) => {
          const currentMsg = messages[index];
          return !currentMsg || 
                 prevMsg.id !== currentMsg.id || 
                 prevMsg.content !== currentMsg.content ||
                 prevMsg.role !== currentMsg.role;
        });
      
      if (hasChanged) {
        previousMessagesRef.current = messages;
        onMessagesChange(messages);
      }
    }
  }, [messages, onMessagesChange]);

  // Sync initialMessages only when it actually changes from parent
  useEffect(() => {
    // Compare with previous initialMessages value, not with current internal messages
    const hasChanged = 
      previousInitialMessagesRef.current.length !== initialMessages.length ||
      previousInitialMessagesRef.current.some((prevMsg, index) => {
        const currentMsg = initialMessages[index];
        return !currentMsg || 
               prevMsg.id !== currentMsg.id || 
               prevMsg.content !== currentMsg.content ||
               prevMsg.role !== currentMsg.role;
      });

    // Only update if initialMessages actually changed from parent
    if (hasChanged) {
      previousInitialMessagesRef.current = initialMessages;
      
      // Before syncing, check if initialMessages is different from current internal messages
      // This prevents unnecessary updates that could trigger loops
      const differsFromInternal = 
        messages.length !== initialMessages.length ||
        messages.some((msg, index) => {
          const initMsg = initialMessages[index];
          return !initMsg || 
                 msg.id !== initMsg.id || 
                 msg.content !== initMsg.content ||
                 msg.role !== initMsg.role;
        });
      
      // Only sync if initialMessages is not empty, and it differs from internal state
      // (or if we're on initial mount)
      if (isInitialMountRef.current || (initialMessages.length > 0 && differsFromInternal)) {
        setMessages(initialMessages);
        previousMessagesRef.current = initialMessages;
        isInitialMountRef.current = false;
      }
    } else if (isInitialMountRef.current) {
      // On initial mount, ensure we're synced even if arrays are the same
      isInitialMountRef.current = false;
    }
  }, [initialMessages, messages]);

  // Auto-resize textarea when inputMessage changes
  useLayoutEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      console.log('[TEXTAREA RESIZE] useLayoutEffect triggered', {
        inputMessageLength: inputMessage.length,
        inputMessageLines: inputMessage.split('\n').length,
        inputMessagePreview: inputMessage.substring(0, 50),
        currentHeight: textarea.style.height,
        currentScrollHeight: textarea.scrollHeight,
        currentOffsetHeight: textarea.offsetHeight,
        currentClientHeight: textarea.clientHeight,
        computedHeight: window.getComputedStyle(textarea).height,
        computedMinHeight: window.getComputedStyle(textarea).minHeight,
        computedMaxHeight: window.getComputedStyle(textarea).maxHeight,
      });
      
      // Reset to auto to get accurate scrollHeight
      textarea.style.setProperty('height', 'auto', 'important');
      // Also reset min-height to ensure it doesn't interfere
      textarea.style.setProperty('min-height', '0px', 'important');
      // Force a reflow to ensure scrollHeight is accurate
      void textarea.offsetHeight;
      
      // Get the actual scroll height needed for content
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      const singleLineHeight = 40;
      // Calculate new height - always ensure minimum single line height
      const newHeight = Math.max(singleLineHeight, Math.min(scrollHeight, maxHeight));
      
      console.log('[TEXTAREA RESIZE] Calculations', {
        scrollHeight,
        maxHeight,
        singleLineHeight,
        calculatedNewHeight: newHeight,
      });
      
      // Set both height and min-height explicitly with !important to override CSS
      textarea.style.setProperty('height', `${newHeight}px`, 'important');
      textarea.style.setProperty('min-height', `${newHeight}px`, 'important');
      
      // Log after setting height
      requestAnimationFrame(() => {
        const computed = window.getComputedStyle(textarea);
        const inputGroup = textarea.closest('[data-slot="input-group"]');
        console.log('[TEXTAREA RESIZE] After setting height', {
          styleHeight: textarea.style.height,
          offsetHeight: textarea.offsetHeight,
          clientHeight: textarea.clientHeight,
          scrollHeight: textarea.scrollHeight,
          computedHeight: computed.height,
          computedMinHeight: computed.minHeight,
          computedMaxHeight: computed.maxHeight,
          computedPadding: computed.padding,
          computedPaddingTop: computed.paddingTop,
          computedPaddingBottom: computed.paddingBottom,
          computedBoxSizing: computed.boxSizing,
          computedLineHeight: computed.lineHeight,
          parentHeight: textarea.parentElement?.clientHeight,
          parentComputedHeight: textarea.parentElement ? window.getComputedStyle(textarea.parentElement).height : null,
          inputGroupHeight: inputGroup?.clientHeight,
          inputGroupComputedHeight: inputGroup ? window.getComputedStyle(inputGroup).height : null,
          inputGroupComputedMinHeight: inputGroup ? window.getComputedStyle(inputGroup).minHeight : null,
          allClassNames: textarea.className,
        });
      });
    } else {
      console.log('[TEXTAREA RESIZE] textareaRef.current is null');
    }
  }, [inputMessage]);

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
    // Reset textarea height - useLayoutEffect will handle this when inputMessage changes
    if (textareaRef.current) {
      textareaRef.current.style.setProperty('height', '40px', 'important');
      textareaRef.current.style.setProperty('min-height', '40px', 'important');
    }
    setIsLoading(true);

    let assistantMessage: Message | null = null;

    try {
      const payload = config.getMessagePayload 
        ? config.getMessagePayload(userMessage.content)
        : { message: userMessage.content };

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
              if (config.onMessageComplete) {
                try {
                  await Promise.resolve(config.onMessageComplete());
                } catch (error) {
                  console.error('Error in onMessageComplete:', error);
                }
              }
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              // Handle upgrade-required events
              if (parsed.type === 'upgrade-required') {
                console.log('[CHAT INTERFACE] Upgrade required event received');
                if (onUpgradeRequired) {
                  try {
                    onUpgradeRequired();
                    console.log('[CHAT INTERFACE] Upgrade required callback executed');
                  } catch (error) {
                    console.error('[CHAT INTERFACE] Error in upgrade required callback:', error);
                  }
                } else {
                  console.warn('[CHAT INTERFACE] Upgrade required event received but no callback provided');
                }
                // Don't return early - let other processing continue
                continue;
              }
              
              // Handle tool result events for routine updates
              if (parsed.type === 'tool-result' && config.queryClient && config.userId) {
                const { toolId, result, isError } = parsed;
                
                console.log('[CHAT INTERFACE] Tool result received:', {
                  toolId,
                  hasResult: !!result,
                  resultStructure: result ? Object.keys(result) : null,
                  result,
                  isError,
                  hasQueryClient: !!config.queryClient,
                  userId: config.userId,
                });
                
                // Only update cache if tool succeeded and result has data
                if (!isError && result) {
                  try {
                    if (toolId === 'create-draft-routine' || toolId === 'update-draft-routine') {
                      // Update draft routine cache
                      const draftData = result.draft || result;
                      console.log('[CHAT INTERFACE] Processing draft routine update:', {
                        toolId,
                        draftData,
                        hasId: draftData?.id,
                      });
                      
                      if (draftData && draftData.id) {
                        // First, check if there's an existing query in cache to match its format
                        const allQueries = config.queryClient.getQueryCache().getAll();
                        const draftQuery = allQueries.find((q) => {
                          const key = q.queryKey;
                          return (
                            Array.isArray(key) &&
                            Array.isArray(key[0]) &&
                            key[0][0] === 'routine' &&
                            key[0][1] === 'getDraftRoutine'
                          );
                        });
                        
                        console.log('[CHAT INTERFACE] Found existing draft query in cache:', {
                          found: !!draftQuery,
                          existingKey: draftQuery?.queryKey,
                          existingKeyString: draftQuery?.queryKey ? JSON.stringify(draftQuery.queryKey) : null,
                        });
                        
                        // Try to use existing query key format first (most reliable)
                        let cacheUpdated = false;
                        if (draftQuery) {
                          try {
                            config.queryClient.setQueryData(draftQuery.queryKey, draftData);
                            console.log('[CHAT INTERFACE] ✓ Cache update successful using existing query key format');
                            cacheUpdated = true;
                          } catch (e) {
                            console.error('[CHAT INTERFACE] Failed to update using existing query key:', e);
                          }
                        }
                        
                        // Fallback: Try known query key formats
                        if (!cacheUpdated) {
                          const queryKeyFormat1 = [
                            ['routine', 'getDraftRoutine'],
                            { type: 'query', input: { userId: config.userId } },
                          ];
                          const queryKeyFormat2 = [
                            ['routine', 'getDraftRoutine'],
                            { input: { userId: config.userId } },
                          ];
                          
                          console.log('[CHAT INTERFACE] Trying fallback query key formats:', {
                            format1: queryKeyFormat1,
                            format2: queryKeyFormat2,
                          });
                          
                          try {
                            config.queryClient.setQueryData(queryKeyFormat1, draftData);
                            console.log('[CHAT INTERFACE] ✓ Cache update successful with format 1 (type: query)');
                            cacheUpdated = true;
                          } catch (e1) {
                            console.log('[CHAT INTERFACE] Format 1 failed, trying format 2:', e1);
                            try {
                              config.queryClient.setQueryData(queryKeyFormat2, draftData);
                              console.log('[CHAT INTERFACE] ✓ Cache update successful with format 2 (no type)');
                              cacheUpdated = true;
                            } catch (e2) {
                              console.error('[CHAT INTERFACE] All query key formats failed:', e2);
                            }
                          }
                        }
                        
                        // Log all relevant queries for debugging
                        const relevantQueries = allQueries.filter((q) => {
                          const key = q.queryKey;
                          return (
                            Array.isArray(key) &&
                            Array.isArray(key[0]) &&
                            key[0][0] === 'routine' &&
                            (key[0][1] === 'getDraftRoutine' || key[0][1] === 'getActiveRoutine')
                          );
                        });
                        console.log('[CHAT INTERFACE] All relevant TRPC queries in cache:', {
                          count: relevantQueries.length,
                          queryKeys: relevantQueries.map((q) => ({
                            key: q.queryKey,
                            stringified: JSON.stringify(q.queryKey),
                            state: q.state.status,
                          })),
                        });
                      } else {
                        console.log('[CHAT INTERFACE] Draft data missing or invalid:', draftData);
                      }
                    } else if (toolId === 'activate-draft-routine') {
                      // Update active routine cache and clear draft cache
                      const routineData = result.routine || result;
                      console.log('[CHAT INTERFACE] Processing activate routine update:', {
                        routineData,
                        hasId: routineData?.id,
                      });
                      
                      if (routineData && routineData.id) {
                        // First, check if there are existing queries in cache to match their format
                        const allQueries = config.queryClient.getQueryCache().getAll();
                        const activeQuery = allQueries.find((q) => {
                          const key = q.queryKey;
                          return (
                            Array.isArray(key) &&
                            Array.isArray(key[0]) &&
                            key[0][0] === 'routine' &&
                            key[0][1] === 'getActiveRoutine'
                          );
                        });
                        const draftQuery = allQueries.find((q) => {
                          const key = q.queryKey;
                          return (
                            Array.isArray(key) &&
                            Array.isArray(key[0]) &&
                            key[0][0] === 'routine' &&
                            key[0][1] === 'getDraftRoutine'
                          );
                        });
                        
                        // Update active routine
                        let activeUpdated = false;
                        if (activeQuery) {
                          try {
                            config.queryClient.setQueryData(activeQuery.queryKey, routineData);
                            console.log('[CHAT INTERFACE] ✓ Active routine cache update successful using existing query key format');
                            activeUpdated = true;
                          } catch (e) {
                            console.error('[CHAT INTERFACE] Failed to update active using existing query key:', e);
                          }
                        }
                        
                        // Fallback: Try known query key formats for active routine
                        if (!activeUpdated) {
                          const activeQueryKey1 = [
                            ['routine', 'getActiveRoutine'],
                            { type: 'query', input: { userId: config.userId } },
                          ];
                          const activeQueryKey2 = [
                            ['routine', 'getActiveRoutine'],
                            { input: { userId: config.userId } },
                          ];
                          
                          try {
                            config.queryClient.setQueryData(activeQueryKey1, routineData);
                            console.log('[CHAT INTERFACE] ✓ Active routine cache update successful with format 1');
                            activeUpdated = true;
                          } catch (e1) {
                            console.log('[CHAT INTERFACE] Active format 1 failed, trying format 2:', e1);
                            try {
                              config.queryClient.setQueryData(activeQueryKey2, routineData);
                              console.log('[CHAT INTERFACE] ✓ Active routine cache update successful with format 2');
                              activeUpdated = true;
                            } catch (e2) {
                              console.error('[CHAT INTERFACE] All active routine query key formats failed:', e2);
                            }
                          }
                        }
                        
                        // Clear draft cache (draft was activated)
                        if (draftQuery) {
                          try {
                            config.queryClient.setQueryData(draftQuery.queryKey, null);
                            console.log('[CHAT INTERFACE] ✓ Draft cache cleared using existing query key format');
                          } catch (e) {
                            console.error('[CHAT INTERFACE] Failed to clear draft using existing query key:', e);
                          }
                        } else {
                          // Fallback: Try known query key formats for draft
                          const draftQueryKey1 = [
                            ['routine', 'getDraftRoutine'],
                            { type: 'query', input: { userId: config.userId } },
                          ];
                          const draftQueryKey2 = [
                            ['routine', 'getDraftRoutine'],
                            { input: { userId: config.userId } },
                          ];
                          
                          try {
                            config.queryClient.setQueryData(draftQueryKey1, null);
                            console.log('[CHAT INTERFACE] ✓ Draft cache cleared with format 1');
                          } catch (e1) {
                            console.log('[CHAT INTERFACE] Draft clear format 1 failed, trying format 2:', e1);
                            try {
                              config.queryClient.setQueryData(draftQueryKey2, null);
                              console.log('[CHAT INTERFACE] ✓ Draft cache cleared with format 2');
                            } catch (e2) {
                              console.error('[CHAT INTERFACE] All draft clear query key formats failed:', e2);
                            }
                          }
                        }
                      } else {
                        console.log('[CHAT INTERFACE] Routine data missing or invalid:', routineData);
                      }
                    }
                  } catch (cacheError) {
                    console.error('[CHAT INTERFACE] Error updating React Query cache:', cacheError);
                    // Fallback: invalidate queries to trigger refetch
                    config.queryClient.invalidateQueries({
                      queryKey: [['routine']],
                    });
                    console.log('[CHAT INTERFACE] Fallback: invalidated all routine queries');
                  }
                } else {
                  console.log('[CHAT INTERFACE] Tool result has error or no result:', { isError, hasResult: !!result });
                }
                // Continue processing - don't return, let text content flow through
              }
              
              // Use custom parser if provided, otherwise use default
              const parsedData = config.parseStreamResponse 
                ? config.parseStreamResponse(parsed)
                : { content: parsed.content, error: parsed.error };

              if (parsedData.content) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage!.id 
                      ? { ...msg, content: msg.content + parsedData.content! }
                      : msg
                  )
                );
              } else if (parsedData.error) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <CardComponent className={`flex flex-col h-full overflow-hidden max-h-full ${isKeyboardOpen ? 'mobile-keyboard-open' : 'mobile-keyboard-aware'} ${className}`}>
      {/* Header */}
      <div className="py-1.5 px-3 flex-shrink-0 border-b bg-background/95 rounded-t-lg h-[44px]">
        <div className="flex items-center justify-between">
          {header}
        </div>
      </div>

      {/* Messages */}
      <CardContentComponent ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 min-h-0 pt-3">
        {messages.length === 0 && emptyState ? (
          emptyState
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
                {config.showTimestamp !== false && (
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
                )}
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
      <CardFooterComponent className="pt-2 flex-shrink-0 items-start">
        <InputGroupComponent className="w-full !h-auto flex-col items-stretch">
          <InputGroupTextareaComponent
            ref={textareaRef}
            value={inputMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              console.log('[TEXTAREA] onChange triggered', {
                newValueLength: e.target.value.length,
                newValueLines: e.target.value.split('\n').length,
                currentHeight: e.target.style.height,
                scrollHeight: e.target.scrollHeight,
                offsetHeight: e.target.offsetHeight,
              });
              setInputMessage(e.target.value);
            }}
            onKeyDown={(e) => {
              console.log('[TEXTAREA] onKeyDown', {
                key: e.key,
                shiftKey: e.shiftKey,
                targetHeight: (e.target as HTMLTextAreaElement).style.height,
                targetScrollHeight: (e.target as HTMLTextAreaElement).scrollHeight,
              });
              handleKeyDown(e);
            }}
            placeholder={config.placeholder}
            disabled={isLoading}
            rows={1}
            className="!min-h-0 text-sm"
            style={{ 
              maxHeight: '120px',
              overflow: 'hidden',
              resize: 'none',
              boxSizing: 'border-box'
            }}
          />
          <InputGroupAddonComponent align="block-end" className="justify-end">
            <InputGroupButtonComponent
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              variant="default"
              size="sm"
              className="rounded-full px-4 py-2"
            >
              <span>Send</span>
              <SendIcon className="h-3.5 w-3.5" />
            </InputGroupButtonComponent>
          </InputGroupAddonComponent>
        </InputGroupComponent>
      </CardFooterComponent>
    </CardComponent>
  );
}

