
-- Enhanced security definer function for VIN valuation cache with improved error handling and logging
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
  v_start_time timestamptz := clock_timestamp();
  v_duration interval;
  v_success boolean := false;
  v_error_message text;
  v_error_detail text;
  v_error_hint text;
  v_existing_id uuid;
BEGIN
  -- Log the start of the function execution
  INSERT INTO system_logs(
    log_type, 
    message, 
    details, 
    created_at, 
    correlation_id
  ) VALUES (
    'cache_operation', 
    'Starting security definer cache function', 
    jsonb_build_object(
      'vin', p_vin,
      'mileage', p_mileage,
      'operation', 'store_cache',
      'auth_role', current_setting('request.jwt.claims', true)::jsonb->>'role'
    ),
    v_start_time,
    p_log_id
  );

  -- Check if record exists
  BEGIN
    SELECT id INTO v_existing_id
    FROM public.vin_valuation_cache
    WHERE vin = p_vin;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := 'Error checking if cache entry exists: ' || SQLERRM;
    v_error_detail := SQLSTATE;
    
    -- Log the error
    INSERT INTO system_logs(
      log_type, 
      message, 
      details, 
      error_message,
      created_at,
      correlation_id
    ) VALUES (
      'cache_operation_error', 
      'Error in security definer cache function', 
      jsonb_build_object(
        'vin', p_vin,
        'operation', 'check_exists',
        'error_state', SQLSTATE
      ),
      v_error_message,
      clock_timestamp(),
      p_log_id
    );
    
    RETURN false;
  END;

  -- Try to insert or update the record
  BEGIN
    IF v_existing_id IS NOT NULL THEN
      -- Update existing record
      UPDATE public.vin_valuation_cache
      SET 
        mileage = p_mileage,
        valuation_data = p_valuation_data,
        created_at = now()
      WHERE id = v_existing_id;
      
      v_success := true;
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
      
      v_success := true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_error_message := 'Error inserting/updating cache entry: ' || SQLERRM;
    v_error_detail := SQLSTATE;
    v_error_hint := 'Check RLS policies and table constraints';
    
    -- Log the error
    INSERT INTO system_logs(
      log_type, 
      message, 
      details, 
      error_message,
      created_at,
      correlation_id
    ) VALUES (
      'cache_operation_error', 
      'Error in security definer cache function', 
      jsonb_build_object(
        'vin', p_vin,
        'operation', CASE WHEN v_existing_id IS NOT NULL THEN 'update' ELSE 'insert' END,
        'error_state', SQLSTATE
      ),
      v_error_message,
      clock_timestamp(),
      p_log_id
    );
    
    RETURN false;
  END;

  -- Calculate duration and log successful completion
  v_duration := clock_timestamp() - v_start_time;
  
  INSERT INTO system_logs(
    log_type, 
    message, 
    details, 
    created_at,
    correlation_id
  ) VALUES (
    'cache_operation', 
    'Successfully completed security definer cache function', 
    jsonb_build_object(
      'vin', p_vin,
      'operation', CASE WHEN v_existing_id IS NOT NULL THEN 'update' ELSE 'insert' END,
      'duration_ms', extract(epoch from v_duration) * 1000
    ),
    clock_timestamp(),
    p_log_id
  );

  RETURN v_success;
END;
$$;

-- Ensure the system_logs table exists
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
CREATE INDEX IF NOT EXISTS system_logs_log_type_idx ON public.system_logs(log_type);

-- Grant permissions for the enhanced function
GRANT EXECUTE ON FUNCTION public.store_vin_valuation_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_vin_valuation_cache TO anon;
GRANT EXECUTE ON FUNCTION public.store_vin_valuation_cache TO service_role;

-- Add RLS policies for system_logs
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

-- Comment on function
COMMENT ON FUNCTION public.store_vin_valuation_cache IS 
  'Security definer function to safely store VIN valuation cache data with enhanced error handling and logging';
