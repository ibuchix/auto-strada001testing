
-- Remove all duplicate or ambiguous is_seller functions, enforce canonical version
-- Created: 2025-06-20

-- Drop all other overloaded is_seller definitions except the zero-arg canonical one
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT
            n.nspname AS schema,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'is_seller'
          AND n.nspname = 'public'
          AND pg_get_function_identity_arguments(p.oid) <> ''
    LOOP
        EXECUTE format(
          'DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;',
          rec.function_name,
          rec.args
        );
    END LOOP;
END $$;

-- Authoritative version: zero-argument, for RLS checks
CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sellers 
    WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_seller() TO authenticated;
