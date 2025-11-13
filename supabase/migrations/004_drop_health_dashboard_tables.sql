-- Drop health dashboard related tables
-- Note: These tables may be referenced by onboarding features, but are being removed as requested

-- Drop tables in reverse dependency order (child tables first)
DROP TABLE IF EXISTS public.routine_completions CASCADE;
DROP TABLE IF EXISTS public.routine_items CASCADE;
DROP TABLE IF EXISTS public.user_routines CASCADE;
DROP TABLE IF EXISTS public.user_goals CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.steps CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.health_metrics_log CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;


