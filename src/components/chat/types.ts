import { QueryClient } from '@tanstack/react-query';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatConfig {
  apiEndpoint: string;
  placeholder: string;
  showTimestamp?: boolean;
  onMessageComplete?: () => Promise<void> | void;
  getMessagePayload?: (message: string, context?: any) => any;
  parseStreamResponse?: (data: any) => { content?: string; sessionId?: string; error?: string };
  queryClient?: QueryClient;
  userId?: string;
}


