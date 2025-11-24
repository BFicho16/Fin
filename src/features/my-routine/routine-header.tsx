'use client';

import { ClipboardList, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActiveRoutine, DraftRoutine } from '@/types/routine';
import { useSheetClose } from '@/components/layouts/chat-page-layout';

export type RoutineView = 'active' | 'draft' | 'add';

interface RoutineHeaderProps {
  routine: ActiveRoutine | null;
  draft: DraftRoutine | null;
  isLoading: boolean;
  currentView: RoutineView;
  isEditing?: boolean;
  isSaving?: boolean;
  onViewChange: (view: RoutineView) => void;
  onEdit?: () => void;
  onActivate?: () => void;
  onClose?: () => void;
  onRefresh?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function RoutineHeader({
  routine,
  draft,
  isLoading,
  currentView,
  isEditing = false,
  isSaving = false,
  onViewChange,
  onEdit,
  onActivate,
  onClose,
  onRefresh,
  onSave,
  onCancel,
}: RoutineHeaderProps) {
  const closeSheet = useSheetClose();
  // Defensive check: Never show draft view if draft is null
  // If currentView is 'draft' but draft is null, treat it as 'active' view
  const effectiveView: RoutineView = currentView === 'draft' && !draft ? 'active' : currentView;

  // Determine title and buttons based on effective view
  const getTitle = () => {
    if (effectiveView === 'active') {
      return 'My Active Routine';
    }
    if (effectiveView === 'draft') {
      return 'Routine';
    }
    return 'Add Your Routine';
  };

  const renderButtons = () => {
    // Add Your Routine view: No buttons (mobile close handled separately)
    if (effectiveView === 'add') {
      return null;
    }

    // Active Routine view: Show refresh button and "View Draft" button if draft exists
    if (effectiveView === 'active') {
      return (
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              title="Refresh routine"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {draft && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewChange('draft')}
            >
              View Draft
            </Button>
          )}
        </div>
      );
    }

    // Draft Routine view: Show "Activate", "Edit", and "Close" buttons
    // Only show if draft actually exists (defensive check)
    if (effectiveView === 'draft' && draft) {
      // When editing, show Save and Cancel buttons
      if (isEditing) {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-2">
          {routine && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={onActivate}
          >
            Activate
          </Button>
        </div>
      );
    }

    return null;
  };

  const buttons = !isLoading ? renderButtons() : null;
  const mobileCloseButton = closeSheet ? (
    <Button
      variant="outline"
      size="sm"
      onClick={closeSheet}
      className="lg:hidden"
    >
      <X className="h-4 w-4" />
    </Button>
  ) : null;

  return (
    <div className="flex items-center justify-between py-1.5 px-3 border-b h-[44px]">
      <div className="flex items-center space-x-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-xs font-medium">
          {getTitle()}
        </h3>
        {/* Show version badge when viewing active routine */}
        {effectiveView === 'active' && routine && (
          <Badge variant="outline">
            Version {routine.version}
          </Badge>
        )}
        {/* Only show draft badge if draft actually exists */}
        {effectiveView === 'draft' && draft && (
          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
            Draft
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {buttons}
        {mobileCloseButton}
      </div>
    </div>
  );
}

