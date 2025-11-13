# Plan: Fix Draft Mode Switching When Agent Creates Draft

## Problem Statement

When the agent creates a new draft routine, the MyRoutine tab does not automatically switch to "draft mode" to show the newly created draft. The user has to manually click "View Draft" to see it.

## Root Cause Analysis

### Current Flow

1. **Initial Load** (`my-routine-tab.tsx` lines 86-98):
   - Sets initial view once based on routine/draft availability
   - Only runs once (`hasSetInitialView` flag prevents re-running)
   - Priority: Active Routine > Draft Routine > Add Your Routine

2. **Draft Polling** (`my-routine-tab.tsx` lines 66-81):
   - Polls for draft updates every 5 seconds
   - Updates `draft` state when draft is detected
   - Uses `fetchDraft` callback that sets `draft` state

3. **View Validation** (`my-routine-tab.tsx` lines 100-111):
   - Prevents invalid states (draft view when draft is null)
   - Switches away from draft view if draft becomes null
   - Does NOT proactively switch TO draft view when draft appears

### The Gap

**Missing Logic**: There's no effect that watches for `draft` transitioning from `null` to non-null and automatically switches the view to 'draft' when this happens.

**Why It Doesn't Work**:
- Initial view logic (lines 86-98) only runs once on initial load
- When agent creates draft later, polling detects it and updates state
- But no effect reacts to draft appearing to switch the view
- User is left on current view (likely 'active' or 'add') even though draft now exists

### Current State Flow

```
Initial Load:
  → Check routine/draft
  → Set initial view (only runs once)
  → hasSetInitialView = true

Agent Creates Draft:
  → Polling detects draft (every 5 seconds)
  → setDraft(newDraft) updates state
  → BUT: No effect triggers view switch
  → View stays on current (e.g., 'active')
```

## Solution Design

### Approach: Auto-Switch on Draft Appearance

Add a new effect that watches for draft transitioning from `null` to non-null and automatically switches to draft view, but only under appropriate conditions.

### Conditions for Auto-Switching

**Should Auto-Switch When**:
1. Draft transitions from `null` → non-null (draft just appeared)
2. User hasn't explicitly chosen a view (track manual view changes)
3. We're not in the middle of loading
4. We're not currently viewing/editing something the user explicitly chose

**Should NOT Auto-Switch When**:
1. User manually changed view (they explicitly chose to stay on active/add)
2. Draft was already visible (transition is draft → draft, not null → draft)
3. User is actively editing the active routine

### Implementation Strategy

**Option 1: Simple Auto-Switch** (Recommended for MVP)
- Always auto-switch to draft view when draft appears (null → non-null)
- Track previous draft state to detect transitions
- Simple, predictable behavior

**Option 2: Smart Auto-Switch** (More refined)
- Auto-switch only if user hasn't manually changed view
- Track if user explicitly clicked a view button
- Respect user's explicit choices

**Option 3: Conditional Auto-Switch** (Most refined)
- Auto-switch if current view is 'add' (no routine exists)
- Auto-switch if no active routine exists
- Don't auto-switch if active routine exists (show "View Draft" button instead)

### Recommended Approach: Option 3 (Conditional Auto-Switch)

This provides the best UX:
- If no active routine: Auto-switch to draft (user wants to see their routine)
- If active routine exists: Don't auto-switch (user can choose to view draft)
- Simple to implement and understand

## Implementation Plan

### Step 1: Add Effect to Detect Draft Appearance

**File**: `src/features/my-routine/my-routine-tab.tsx`

**Changes**:
1. Add ref to track previous draft state
2. Add effect that watches for draft null → non-null transition
3. Implement conditional auto-switch logic

**Code Location**: After the view validation effect (around line 111)

**Logic**:
```typescript
// Track previous draft to detect transitions
const prevDraftRef = useRef<DraftRoutine | null>(null);

// Auto-switch to draft view when draft appears (if appropriate)
useEffect(() => {
  const prevDraft = prevDraftRef.current;
  const currentDraft = draft;
  
  // Detect transition: null → non-null (draft just appeared)
  if (!prevDraft && currentDraft) {
    // Only auto-switch if:
    // 1. We're not loading
    // 2. We're not in an invalid state
    // 3. (Conditional) Either no active routine, OR current view is 'add'
    if (!isLoading && !isLoadingDraft) {
      // Option 3: Only auto-switch if no active routine or current view is 'add'
      // This respects user if they're viewing active routine
      if (!routine || currentView === 'add') {
        setCurrentView('draft');
      }
    }
  }
  
  // Update ref for next comparison
  prevDraftRef.current = currentDraft;
}, [draft, routine, currentView, isLoading, isLoadingDraft]);
```

### Step 2: Ensure Initial Draft Check Sets View Correctly

**File**: `src/features/my-routine/my-routine-tab.tsx`

**Changes**: 
- Ensure `prevDraftRef` is initialized correctly
- Handle edge case where draft exists on initial load

**Code Location**: In the initial draft fetch effect

**Logic**:
```typescript
// Initialize prevDraftRef with null
const prevDraftRef = useRef<DraftRoutine | null>(null);

// After initial draft fetch, update ref
useEffect(() => {
  if (!isLoadingDraft && hasSetInitialView) {
    prevDraftRef.current = draft;
  }
}, [draft, isLoadingDraft, hasSetInitialView]);
```

### Step 3: Testing

**Test Cases**:
1. **Agent creates draft when no active routine exists**
   - Expected: Auto-switch to draft view
   - Action: Agent creates draft, wait for polling

2. **Agent creates draft when active routine exists**
   - Expected: Stay on active view, show "View Draft" button
   - Action: Agent creates draft, verify view doesn't change

3. **Agent creates draft when on 'add' view**
   - Expected: Auto-switch to draft view
   - Action: Start on 'add' view, agent creates draft

4. **User manually switches to active, then agent creates draft**
   - Expected: Stay on active view (respect user choice)
   - Action: Manually click active view, agent creates draft

5. **Draft appears during initial load**
   - Expected: Initial view logic sets to draft
   - Action: Load page with draft already existing

### Step 4: Edge Cases

**Edge Case 1**: Draft appears while user is editing active routine
- Solution: Don't auto-switch if `isEditing` is true
- Implementation: Add `isEditing` to effect dependencies

**Edge Case 2**: Multiple drafts appear in quick succession
- Solution: Effect handles latest state correctly
- Implementation: Ref tracks current state

**Edge Case 3**: Draft appears, then disappears (deleted)
- Solution: Existing validation effect handles this (lines 100-111)
- Implementation: No change needed

### Step 5: Performance Considerations

**Polling Impact**:
- Current polling is every 5 seconds
- New effect runs on every draft state change
- Minimal impact: Effect is O(1) comparison

**Re-render Optimization**:
- Effect only runs when draft, routine, or view changes
- No unnecessary re-renders
- Use ref to prevent effect from running on every render

## Files to Modify

1. **`src/features/my-routine/my-routine-tab.tsx`**
   - Add `prevDraftRef` ref
   - Add effect to detect draft appearance and auto-switch
   - Ensure proper initialization

## Success Criteria

1. ✅ When agent creates draft and no active routine exists, view automatically switches to draft
2. ✅ When agent creates draft and active routine exists, view stays on active (user can choose)
3. ✅ When agent creates draft and user is on 'add' view, view switches to draft
4. ✅ User can still manually switch views normally
5. ✅ No breaking changes to existing functionality
6. ✅ Polling continues to work as expected
7. ✅ Edge cases (editing, multiple drafts) are handled correctly

## Alternative Solutions Considered

### Alternative 1: Real-time Updates (WebSockets/Supabase Realtime)
- **Pros**: Instant updates, no polling delay
- **Cons**: More complex, requires Supabase realtime setup
- **Decision**: Not needed for MVP, polling works fine

### Alternative 2: Agent API Returns Draft Info
- **Pros**: Immediate feedback when agent creates draft
- **Cons**: Requires API changes, agent might not always create draft
- **Decision**: Polling is simpler and works for all cases

### Alternative 3: Always Auto-Switch (Simplest)
- **Pros**: Very simple, always shows draft when created
- **Cons**: Might interrupt user if they're viewing active routine
- **Decision**: Use conditional auto-switch for better UX

## Implementation Notes

1. **Timing**: The effect should run after initial view is set, but the comparison logic handles this correctly
2. **Race Conditions**: Using ref prevents race conditions from rapid state changes
3. **User Experience**: Conditional logic respects user's current context
4. **Testing**: Test with actual agent interactions to verify behavior

## Future Enhancements

1. **Real-time Updates**: Consider Supabase realtime for instant draft notifications
2. **Toast Notifications**: Show toast when draft is created (optional enhancement)
3. **Draft Badge**: Animate badge when draft appears (visual feedback)
4. **User Preference**: Allow users to toggle auto-switch behavior

