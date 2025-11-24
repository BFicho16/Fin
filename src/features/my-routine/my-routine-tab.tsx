'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/trpc-client';
import RoutineDisplay, { RoutineDisplayHandle } from './routine-display';
import RoutineHeader, { RoutineView } from './routine-header';

interface MyRoutineTabProps {
  userId: string;
}

export default function MyRoutineTab({ userId }: MyRoutineTabProps) {
  const utils = api.useUtils();
  const { data: routine, isLoading: isLoadingActive, error: activeError } = api.routine.getActiveRoutine.useQuery(
    { userId },
    {
      placeholderData: (previousData) => previousData,
    }
  );

  const { data: draft, isLoading: isLoadingDraft, error: draftError } = api.routine.getDraftRoutine.useQuery(
    { userId },
    {
      placeholderData: (previousData) => previousData,
    }
  );

  const [currentView, setCurrentView] = useState<RoutineView>('active');
  const [hasSetInitialView, setHasSetInitialView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const displayRef = useRef<RoutineDisplayHandle>(null);
  const prevDraftRef = useRef<any>(null);

  // Calculate default view based on routine/draft availability on initial load
  // Priority: Active Routine > Draft Routine (only if draft exists) > Add Your Routine
  // CRITICAL: Never set view to 'draft' if draft is null
  useEffect(() => {
    if (!isLoadingActive && !isLoadingDraft && !hasSetInitialView) {
      if (routine) {
        setCurrentView('active');
      } else if (draft) {
        // Only set to draft if draft actually exists
        setCurrentView('draft');
      } else {
        setCurrentView('add');
      }
      setHasSetInitialView(true);
    }
  }, [routine, draft, isLoadingActive, isLoadingDraft, hasSetInitialView]);

  // Enforce view validity: Never allow 'draft' view when draft is null
  // If currentView is 'draft' but draft is null, switch to appropriate view
  useEffect(() => {
    if (currentView === 'draft' && !draft) {
      // Draft view is invalid - switch to active if routine exists, otherwise add
      if (routine) {
        setCurrentView('active');
      } else {
        setCurrentView('add');
      }
    }
  }, [currentView, draft, routine]);

  // Auto-switch to draft view when draft appears (if appropriate)
  // Only auto-switch if no active routine exists OR user is on 'add' view
  // This respects user's context - if they're viewing active routine, don't interrupt
  useEffect(() => {
    const prevDraft = prevDraftRef.current;
    const currentDraft = draft;

    // Detect transition: null → non-null (draft just appeared)
    if (!prevDraft && currentDraft) {
      // Only auto-switch if:
      // 1. We're not loading
      // 2. Initial view has been set (we've passed initial load)
      // 3. We're not currently editing (don't interrupt user)
      // 4. Either no active routine OR current view is 'add'
      //    (respect user if they're viewing active routine)
      if (
        !isLoadingActive &&
        !isLoadingDraft &&
        hasSetInitialView &&
        !isEditing
      ) {
        // Auto-switch to draft if:
        // - No active routine exists (user wants to see their routine)
        // - OR user is on 'add' view (draft appeared, show it)
        if (!routine || currentView === 'add') {
          setCurrentView('draft');
        }
      }
    }

    // Update ref for next comparison
    prevDraftRef.current = currentDraft;
  }, [draft, routine, currentView, isLoadingActive, isLoadingDraft, hasSetInitialView, isEditing]);

  const isLoading = isLoadingActive || isLoadingDraft;
  // Convert TRPC error to Error type for RoutineDisplay
  const error = activeError 
    ? new Error(activeError.message || 'Failed to load routine')
    : draftError
    ? new Error(draftError.message || 'Failed to load draft')
    : null;

  // Handle view changes from header
  // Prevent switching to 'draft' view if draft is null
  const handleViewChange = (view: RoutineView) => {
    // Never allow switching to draft view if no draft exists
    if (view === 'draft' && !draft) {
      // If trying to view draft but no draft exists, switch to active instead
      if (routine) {
        setCurrentView('active');
      } else {
        setCurrentView('add');
      }
      return;
    }
    setCurrentView(view);
  };

  // Handle close button - switch back to active view
  const handleClose = () => {
    setCurrentView('active');
  };

  // Handle edit state change from RoutineDisplay
  const handleEditStateChange = useCallback((editing: boolean) => {
    setIsEditing(editing);
  }, []);

  // Handle saving state change from RoutineDisplay
  const handleSavingStateChange = useCallback((saving: boolean) => {
    setIsSaving(saving);
  }, []);

  // Handle save button click
  const handleSave = useCallback(async () => {
    if (displayRef.current) {
      await displayRef.current.handleSave();
    }
  }, []);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    if (displayRef.current) {
      displayRef.current.handleCancel();
    }
  }, []);

  // Handle edit button - trigger edit mode in RoutineDisplay
  const handleEdit = useCallback(() => {
    displayRef.current?.startEdit();
  }, []);

  // Handle activate button - trigger activate dialog in RoutineDisplay
  const handleActivate = useCallback(() => {
    displayRef.current?.triggerActivate();
  }, []);

  // Handle refresh button - refetch active routine from database
  const handleRefresh = useCallback(async () => {
    await utils.routine.getActiveRoutine.refetch({ userId });
  }, [utils.routine.getActiveRoutine, userId]);

  // Handle draft update - invalidate queries to trigger refetch
  // Cache updates from tool results should handle most cases, but this is a fallback
  const handleDraftUpdate = useCallback(async () => {
    // Invalidate both queries to ensure fresh data
    await Promise.all([
      utils.routine.getActiveRoutine.invalidate({ userId }),
      utils.routine.getDraftRoutine.invalidate({ userId }),
    ]);
    
    // After invalidating, check if draft still exists to determine view
    // The query will refetch and update, then the useEffect will handle view switching
    const draftData = await utils.routine.getDraftRoutine.fetch({ userId });
    
    // Immediately switch to active view if draft is null (draft was activated)
    if (currentView === 'draft' && !draftData) {
      setCurrentView('active');
    }
  }, [utils.routine.getActiveRoutine, utils.routine.getDraftRoutine, userId, currentView]);

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background">
        <RoutineHeader
          routine={routine ?? null}
          draft={draft}
          isLoading={isLoading}
          currentView={currentView}
          isEditing={isEditing}
          isSaving={isSaving}
          onViewChange={handleViewChange}
          onClose={handleClose}
          onEdit={handleEdit}
          onActivate={handleActivate}
          onRefresh={handleRefresh}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <RoutineDisplay
          ref={displayRef}
          routine={routine ?? null}
          draft={draft}
          isLoading={isLoading}
          error={error}
          userId={userId}
          currentView={currentView}
          onDraftUpdate={handleDraftUpdate}
          onEditStateChange={handleEditStateChange}
          onSavingStateChange={handleSavingStateChange}
        />
      </div>
    </div>
  );
}
