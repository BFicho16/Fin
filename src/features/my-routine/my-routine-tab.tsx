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

  const [draft, setDraft] = useState<any>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [draftError, setDraftError] = useState<Error | null>(null);
  const [currentView, setCurrentView] = useState<RoutineView>('active');
  const [hasSetInitialView, setHasSetInitialView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isInitialLoad = useRef(true);
  const fetchDraftRef = useRef<((isPolling?: boolean) => Promise<void>) | null>(null);
  const displayRef = useRef<RoutineDisplayHandle>(null);
  const prevDraftRef = useRef<any>(null);

  const fetchDraft = useCallback(async (isPolling = false) => {
    try {
      // Only set loading state on initial load, not on polling
      if (!isPolling) {
        setIsLoadingDraft(true);
      }
      setDraftError(null);
      const response = await fetch(`/api/routines/${userId}/draft`);
      if (!response.ok) {
        throw new Error('Failed to fetch draft');
      }
      const data = await response.json();
      setDraft(data.draft);
    } catch (err) {
      setDraftError(err instanceof Error ? err : new Error('Failed to load draft'));
      setDraft(null);
    } finally {
      if (!isPolling) {
        setIsLoadingDraft(false);
      }
      isInitialLoad.current = false;
    }
  }, [userId]);

  // Keep ref in sync with callback
  useEffect(() => {
    fetchDraftRef.current = fetchDraft;
  }, [fetchDraft]);

  // Initial fetch
  useEffect(() => {
    fetchDraft(false);
  }, [fetchDraft]);

  // Poll for draft updates every 2 seconds
  // Always poll to catch newly created drafts
  // BUT: Don't poll while user is viewing the draft (it might overwrite their edits)
  // We'll rely on onDraftUpdate callback when saves happen
  useEffect(() => {
    // Only poll if we're not in the middle of editing (we can't tell from here, so we'll poll less frequently)
    // Actually, let's disable auto-polling since it can interfere with editing
    // The component will refresh when saves happen via onDraftUpdate callback
    // For now, keep polling but less frequently
    const interval = setInterval(() => {
      if (fetchDraftRef.current) {
        fetchDraftRef.current(true);
      }
    }, 5000); // Poll every 5 seconds instead of 2 to reduce interference with editing

    return () => clearInterval(interval);
  }, []); // Empty dependency array - use ref to avoid re-creating interval

  // Initialize prevDraftRef when draft is first loaded
  useEffect(() => {
    if (!isLoadingDraft && prevDraftRef.current === null) {
      prevDraftRef.current = draft;
    }
  }, [draft, isLoadingDraft]);

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
    : draftError;

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

  // Handle edit button - trigger edit mode in RoutineDisplay
  const handleEdit = useCallback(() => {
    displayRef.current?.startEdit();
  }, []);

  // Handle activate button - trigger activate dialog in RoutineDisplay
  const handleActivate = useCallback(() => {
    displayRef.current?.triggerActivate();
  }, []);

  // Handle draft update - refresh draft and potentially switch views
  const handleDraftUpdate = useCallback(async () => {
    // Fetch draft and check if it exists
    let draftExists = false;
    try {
      const response = await fetch(`/api/routines/${userId}/draft`);
      if (response.ok) {
        const data = await response.json();
        draftExists = data.draft !== null;
        setDraft(data.draft);
      } else {
        setDraft(null);
      }
    } catch (err) {
      setDraft(null);
    }
    
    // After activating, invalidate and refetch the active routine query
    // This ensures the active routine is updated after activation
    await utils.routine.getActiveRoutine.invalidate({ userId });
    
    // Immediately switch to active view if draft is null (draft was activated)
    // No timeout delay - switch immediately to prevent showing draft header
    if (currentView === 'draft' && !draftExists) {
      setCurrentView('active');
    }
  }, [utils.routine.getActiveRoutine, userId, currentView]);

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background">
        <RoutineHeader
          routine={routine ?? null}
          draft={draft}
          isLoading={isLoading}
          currentView={currentView}
          isEditing={isEditing}
          onViewChange={handleViewChange}
          onClose={handleClose}
          onEdit={handleEdit}
          onActivate={handleActivate}
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
        />
      </div>
    </div>
  );
}
