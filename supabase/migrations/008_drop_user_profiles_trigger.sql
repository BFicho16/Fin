-- Drop the trigger and function that reference the dropped user_profiles table
-- This trigger was trying to insert into user_profiles when new users are created,
-- but user_profiles was dropped in migration 004

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user_profile();


