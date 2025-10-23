'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { onboardingCategories, getAllCategories } from '@/components/onboarding/onboardingConfig';

export interface CategoryStatus {
  id: string;
  completed: boolean;
  data: any;
  displayData?: { count: number; items: string[] };
}

export interface OnboardingProgress {
  categoryStatuses: CategoryStatus[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useOnboardingProgress(userId: string) {
  const [progress, setProgress] = useState<OnboardingProgress>({
    categoryStatuses: [],
    isComplete: false,
    isLoading: true,
    error: null,
  });

  const fetchCategoryData = useCallback(async (categoryId: string) => {
    const category = onboardingCategories[categoryId];
    if (!category) return null;

    try {
      const response = await fetch(category.fetchEndpoint(userId));
      if (!response.ok) {
        console.warn(`Failed to fetch ${categoryId}:`, response.statusText);
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`Error fetching ${categoryId}:`, error);
      return null;
    }
  }, [userId]);

  const updateCategoryStatus = useCallback(async (categoryId: string) => {
    const category = onboardingCategories[categoryId];
    if (!category) return;

    const data = await fetchCategoryData(categoryId);
    const completed = category.checkCompletion(data);
    const displayData = category.getDisplayData ? category.getDisplayData(data) : undefined;

    setProgress(prev => {
      const existingIndex = prev.categoryStatuses.findIndex(status => status.id === categoryId);
      const newStatus: CategoryStatus = {
        id: categoryId,
        completed,
        data,
        displayData,
      };

      let newCategoryStatuses;
      if (existingIndex >= 0) {
        newCategoryStatuses = [...prev.categoryStatuses];
        newCategoryStatuses[existingIndex] = newStatus;
      } else {
        newCategoryStatuses = [...prev.categoryStatuses, newStatus];
      }

      // Check if all required categories are complete
      const requiredCategories = getAllCategories().filter(cat => cat.required);
      const isComplete = requiredCategories.every(cat => {
        const status = newCategoryStatuses.find(s => s.id === cat.id);
        return status?.completed || false;
      });

      return {
        ...prev,
        categoryStatuses: newCategoryStatuses,
        isComplete,
      };
    });
  }, [fetchCategoryData]);

  const fetchAllCategories = useCallback(async () => {
    setProgress(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const categories = getAllCategories();
      await Promise.all(categories.map(category => updateCategoryStatus(category.id)));
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      setProgress(prev => ({ 
        ...prev, 
        error: 'Failed to load onboarding progress',
        isLoading: false 
      }));
      return;
    }

    setProgress(prev => ({ ...prev, isLoading: false }));
  }, [updateCategoryStatus]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const subscriptions: any[] = [];

    // Subscribe to relevant table changes
    const tablesToWatch = [
      'user_profiles',
      'user_goals', 
      'user_dietary_preferences',
      'user_routines',
      'routine_items',
      'health_metrics_log'
    ];

    tablesToWatch.forEach(table => {
      const subscription = supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`${table} changed:`, payload);
            // Refetch relevant categories when data changes
            if (table === 'user_profiles') {
              updateCategoryStatus('demographics');
            } else if (table === 'health_metrics_log') {
              updateCategoryStatus('healthMetrics');
            } else if (table === 'user_goals') {
              updateCategoryStatus('goals');
            } else if (table === 'user_dietary_preferences') {
              updateCategoryStatus('dietaryPreferences');
            } else if (table === 'user_routines' || table === 'routine_items') {
              updateCategoryStatus('routines');
            }
          }
        )
        .subscribe();

      subscriptions.push(subscription);
    });

    // Initial fetch
    fetchAllCategories();

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [userId, fetchAllCategories, updateCategoryStatus]);

  return progress;
}
