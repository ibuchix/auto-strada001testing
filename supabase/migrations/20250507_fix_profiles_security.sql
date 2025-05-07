
-- Migration to fix profiles table security
-- 2025-05-07: Adding more secure policies and security definer functions

-- First check if get_profile function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_profile' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Create the get_profile function if it doesn't exist
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.get_profile(p_user_id uuid)
      RETURNS SETOF public.profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $inner_func$
      BEGIN
        RETURN QUERY
        SELECT * FROM public.profiles
        WHERE id = p_user_id;
      END;
      $inner_func$;
    $func$;
  END IF;
END
$$;

-- Ensure profiles table has Row Level Security enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create or update the check_seller_exists function for safer seller verification
CREATE OR REPLACE FUNCTION public.check_seller_exists(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Check if the seller record exists
  SELECT EXISTS(
    SELECT 1
    FROM public.sellers
    WHERE user_id = p_user_id
  ) INTO v_exists;
  
  -- Return result
  RETURN jsonb_build_object(
    'exists', v_exists
  );
END;
$$;

-- Commit changes
COMMIT;
