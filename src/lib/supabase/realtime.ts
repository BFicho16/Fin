'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface HealthDataUpdate {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  userId: string;
}

export interface RealtimeCallbacks {
  onHealthMetricsUpdate?: (data: any) => void;
  onMealsUpdate?: (data: any) => void;
  onStepsUpdate?: (data: any) => void;
  onExercisesUpdate?: (data: any) => void;
  onSupplementsUpdate?: (data: any) => void;
  onGoalsUpdate?: (data: any) => void;
  onPlansUpdate?: (data: any) => void;
  onProfileUpdate?: (data: any) => void;
}

export function useHealthDataRealtime(userId: string, callbacks: RealtimeCallbacks = {}) {
  const supabase = createClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  const subscribeToTable = useCallback((
    table: string,
    callback?: (data: any) => void
  ) => {
    if (!callback) return;

    const channel = supabase
      .channel(`${table}_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log(`Realtime update for ${table}:`, payload);
          callback(payload);
        }
      )
      .subscribe();

    channelsRef.current.push(channel);
    return channel;
  }, [supabase, userId]);

  useEffect(() => {
    // Subscribe to all relevant tables
    subscribeToTable('health_metrics', callbacks.onHealthMetricsUpdate);
    subscribeToTable('meals', callbacks.onMealsUpdate);
    subscribeToTable('steps', callbacks.onStepsUpdate);
    subscribeToTable('exercises', callbacks.onExercisesUpdate);
    subscribeToTable('supplements', callbacks.onSupplementsUpdate);
    subscribeToTable('goals', callbacks.onGoalsUpdate);
    subscribeToTable('wellness_plans', callbacks.onPlansUpdate);
    subscribeToTable('user_profiles', callbacks.onProfileUpdate);

    // Cleanup function
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [userId, callbacks, subscribeToTable]);

  return {
    isConnected: channelsRef.current.length > 0,
    channelCount: channelsRef.current.length
  };
}

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
