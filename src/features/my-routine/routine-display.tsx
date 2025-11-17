'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RoutineEmptyCard from './routine-empty-card';
import { ActiveRoutine, DraftRoutine } from '@/types/routine';
import { RoutineView } from './routine-header';
import { api } from '@/lib/trpc-client';
import { isProUser } from '@/lib/subscription';

interface RoutineDisplayProps {
  routine: ActiveRoutine | null;
  draft: DraftRoutine | null;
  isLoading: boolean;
  error: Error | null;
  userId: string;
  currentView: RoutineView;
  onDraftUpdate?: () => void;
  onEditStateChange?: (isEditing: boolean) => void;
}

export interface RoutineDisplayHandle {
  startEdit: () => void;
  triggerActivate: () => void;
  isEditing: boolean;
}

const RoutineDisplay = forwardRef<RoutineDisplayHandle, RoutineDisplayProps>(
  (
    {
      routine,
      draft,
      isLoading,
      error,
      userId,
      currentView,
      onDraftUpdate,
      onEditStateChange,
    },
    ref
  ) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [showActivateDialog, setShowActivateDialog] = useState(false);
    
    // Get subscription status
    const { data: subscription } = api.subscription.getSubscription.useQuery();
    
    // Get routine history to check if this is first activation
    const { data: routineHistory } = api.routine.getRoutineHistory.useQuery(
      { userId, limit: 1 },
      { enabled: !!userId }
    );

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      startEdit: () => {
        if (draft) {
          setIsEditing(true);
        }
      },
      triggerActivate: () => {
        if (draft) {
          // Check if user is pro
          const isPro = isProUser(subscription ?? null);
          
          // Check if this is first activation (no active or past routines)
          const hasExistingRoutines = routineHistory && routineHistory.length > 0;
          const isFirstActivation = !hasExistingRoutines && !routine;
          
          // If first activation and not pro, open upgrade modal
          if (isFirstActivation && !isPro) {
            router.push('/?upgrade=true');
            return;
          }
          
          // If not pro (even if not first activation), block activation
          if (!isPro) {
            router.push('/?upgrade=true');
            return;
          }
          
          setShowActivateDialog(true);
        }
      },
      isEditing,
    }));

    // Notify parent when edit state changes
    useEffect(() => {
      onEditStateChange?.(isEditing);
    }, [isEditing, onEditStateChange]);

    // Initialize edit content when entering edit mode (only once, not when draft changes during editing)
    const draftId = draft?.id || '';
    useEffect(() => {
      if (isEditing && draft) {
        // Only set if editContent is empty or if we just entered edit mode
        // This prevents overwriting user's edits when draft prop updates during polling
        if (editContent === '' || editContent === routine?.content) {
          setEditContent(draft.content);
        }
      }
    }, [isEditing, draftId, draft, routine?.content, editContent]); // Use stable draftId to prevent dependency array size changes

    const handleSaveEdit = async () => {
      if (!draft) return;

      setIsSaving(true);
      try {
        const response = await fetch(`/api/routines/${userId}/draft`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: editContent }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update draft');
        }

        setIsEditing(false);
        onDraftUpdate?.();
      } catch (err) {
        console.error('Error saving draft:', err);
        alert(err instanceof Error ? err.message : 'Failed to save draft');
      } finally {
        setIsSaving(false);
      }
    };

    const handleActivate = async () => {
      if (!draft) return;

      // Check if user is pro
      const isPro = isProUser(subscription ?? null);
      
      // Check if this is first activation (no active or past routines)
      const hasExistingRoutines = routineHistory && routineHistory.length > 0;
      const isFirstActivation = !hasExistingRoutines && !routine;
      
      // If first activation and not pro, open upgrade modal
      if (isFirstActivation && !isPro) {
        setShowActivateDialog(false);
        router.push('/?upgrade=true');
        return;
      }
      
      // If not pro (even if not first activation), block activation
      if (!isPro) {
        setShowActivateDialog(false);
        router.push('/?upgrade=true');
        return;
      }

      setIsActivating(true);
      try {
        const response = await fetch(`/api/routines/${userId}/activate`, {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          // If error is about subscription, redirect to upgrade
          if (response.status === 403 && error.error?.includes('subscription')) {
            setShowActivateDialog(false);
            router.push('/?upgrade=true');
            return;
          }
          throw new Error(error.error || 'Failed to activate routine');
        }

        setShowActivateDialog(false);
        onDraftUpdate?.();
      } catch (err) {
        console.error('Error activating routine:', err);
        alert(err instanceof Error ? err.message : 'Failed to activate routine');
      } finally {
        setIsActivating(false);
      }
    };

    if (isLoading) {
      return (
        <div className="p-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-8">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              Failed to load routine: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // Determine what to display based on currentView
    let displayRoutine: ActiveRoutine | DraftRoutine | null = null;
    if (currentView === 'active') {
      displayRoutine = routine;
    } else if (currentView === 'draft') {
      displayRoutine = draft;
    }

    // Show empty card if no routine to display
    if (currentView === 'add' || !displayRoutine) {
      return (
        <div>
          <RoutineEmptyCard />
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {/* Content area */}
        <div className="p-8">
          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Enter your routine in Markdown format..."
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  You can use Markdown formatting. Changes are saved when you click Save.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent('');
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 first:mt-0">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h4>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto mb-2">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-2">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4 border-muted-foreground/20" />,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {displayRoutine.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Activation confirmation dialog */}
        <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activate Routine</DialogTitle>
              <DialogDescription>
                This will make your draft routine active and replace any currently active routine. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowActivateDialog(false)}
                disabled={isActivating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActivate}
                disabled={isActivating}
              >
                {isActivating ? 'Activating...' : 'Activate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

RoutineDisplay.displayName = 'RoutineDisplay';

export default RoutineDisplay;
