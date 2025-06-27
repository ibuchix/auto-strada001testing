
-- Create the missing validate_vin(text) function required by car RLS policies and input checks
-- This should be run before applying your latest RLS/security migration

CREATE OR REPLACE FUNCTION public.validate_vin(p_vin text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- VIN must be exactly 17 characters, alphanumeric, excluding I,O,Q
  RETURN p_vin ~ '^[A-HJ-NPR-Z0-9]{17}$';
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_vin(text) TO authenticated;
