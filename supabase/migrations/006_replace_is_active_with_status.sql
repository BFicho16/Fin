-- Migration: Replace is_active boolean with status field
-- This allows us to track 'active', 'draft', and 'past' states without deleting past routines

-- Step 1: Add status column with check constraint
ALTER TABLE public.user_routines
ADD COLUMN IF NOT EXISTS status text;

-- Step 2: Migrate existing data
-- is_active = true -> status = 'active'
-- is_active = false -> status = 'draft'
UPDATE public.user_routines
SET status = CASE 
  WHEN is_active = true THEN 'active'
  ELSE 'draft'
END
WHERE status IS NULL;

-- Step 3: Set NOT NULL constraint and default after migration
ALTER TABLE public.user_routines
ALTER COLUMN status SET DEFAULT 'active',
ALTER COLUMN status SET NOT NULL;

-- Step 4: Add check constraint to ensure only valid status values
ALTER TABLE public.user_routines
ADD CONSTRAINT user_routines_status_check 
CHECK (status IN ('active', 'draft', 'past'));

-- Step 5: Drop old indexes related to is_active
DROP INDEX IF EXISTS public.user_routines_user_id_active_idx;
DROP INDEX IF EXISTS public.user_routines_user_id_active_unique;

-- Step 6: Create new indexes on status field
-- Index for querying active routines
CREATE INDEX IF NOT EXISTS user_routines_user_id_status_idx
  ON public.user_routines (user_id, status)
  WHERE status IN ('active', 'draft') AND deleted_at IS NULL;

-- Unique partial index ensuring only one active routine per user
CREATE UNIQUE INDEX IF NOT EXISTS user_routines_user_id_active_unique
  ON public.user_routines (user_id)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Unique partial index ensuring only one draft routine per user
CREATE UNIQUE INDEX IF NOT EXISTS user_routines_user_id_draft_unique
  ON public.user_routines (user_id)
  WHERE status = 'draft' AND deleted_at IS NULL;

-- Step 7: Drop is_active column
ALTER TABLE public.user_routines
DROP COLUMN IF EXISTS is_active;

