
-- Migration to implement security definer function for VIN valuation cache
-- This function bypasses RLS to allow any authenticated user to store VIN valuations

-- Create or update the security definer function
CREATE OR REPLACE FUNCTION public.store_vin_valuation_cache(
  p_vin text,
  p_mileage integer,
  p_valuation_data jsonb,
  p_log_id text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  -- Log operation start
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'cache_operation', 
    'Starting cache security definer function', 
    jsonb_build_object('vin', p_vin, 'operation', 'store_cache'),
    p_log_id
  );

  -- Check if record exists
  SELECT id INTO v_existing_id
  FROM public.vin_valuation_cache
  WHERE vin = p_vin;

  -- Update or insert record
  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.vin_valuation_cache
    SET 
      mileage = p_mileage,
      valuation_data = p_valuation_data,
      created_at = now()
    WHERE id = v_existing_id;
  ELSE
    -- Insert new record
    INSERT INTO public.vin_valuation_cache(
      vin, 
      mileage, 
      valuation_data
    ) VALUES (
      p_vin, 
      p_mileage, 
      p_valuation_data
    );
  END IF;

  -- Log successful completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'cache_operation', 
    'Completed cache security definer function', 
    jsonb_build_object('vin', p_vin, 'operation', 'store_cache', 'success', true),
    p_log_id
  );

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    error_message,
    correlation_id
  ) VALUES (
    'cache_operation_error', 
    'Error in cache security definer function', 
    jsonb_build_object('vin', p_vin, 'operation', 'store_cache'),
    SQLERRM,
    p_log_id
  );
  
  RETURN false;
END;
$$;

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT NULL,
  error_message text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id text DEFAULT NULL
);

-- Add index to help with log lookups
CREATE INDEX IF NOT EXISTS system_logs_correlation_id_idx ON public.system_logs(correlation_id);
CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON public.system_logs(created_at);

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.store_vin_valuation_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_vin_valuation_cache TO anon;
GRANT EXECUTE ON FUNCTION public.store_vin_valuation_cache TO service_role;

-- Add RLS policies
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policy for service_role to have full access to system_logs
CREATE POLICY "Service role has full access to system_logs"
ON public.system_logs
USING (auth.role() = 'service_role');

-- Policy for authenticated users to insert into system_logs
CREATE POLICY "Authenticated users can insert into system_logs"
ON public.system_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Comment on function for clarity
COMMENT ON FUNCTION public.store_vin_valuation_cache IS 
  'Security definer function to safely store VIN valuation cache data while bypassing RLS';
