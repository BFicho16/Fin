'use client';

import { useEffect, useRef } from 'react';
import { createClient } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';


// Hook for individual table subscriptions
export function useTableRealtime<T>(
  userId: string,
  table: string,
  callback: (payload: any) => void
) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, table, callback, supabase]);

  return {
    isConnected: channelRef.current !== null
  };
}

// Utility function to create a debounced callback
export function createDebouncedCallback<T extends any[]>(
  callback: (...args: T) => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

// Helper to check if a table change is relevant to the current user
export function isRelevantUpdate(payload: any, userId: string): boolean {
  return payload?.new?.user_id === userId || payload?.old?.user_id === userId;
}

