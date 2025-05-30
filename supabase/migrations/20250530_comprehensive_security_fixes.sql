
/**
 * Comprehensive Security Fixes Migration
 * Created: 2025-05-30 - Implementing critical security vulnerabilities fixes
 * - Enhanced Row Level Security policies for all tables
 * - Secure file upload validations
 * - Input sanitization and validation functions
 * - Rate limiting and audit logging setup
 */

-- Enable RLS on all critical tables
ALTER TABLE IF EXISTS public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.car_file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vin_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('cars', 'sellers', 'profiles', 'car_file_uploads', 'vin_reservations', 'system_logs')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END
$$;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

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

-- Enhanced input validation functions
CREATE OR REPLACE FUNCTION public.validate_vin(p_vin text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- VIN must be exactly 17 characters, alphanumeric, no I, O, Q
  RETURN p_vin ~ '^[A-HJ-NPR-Z0-9]{17}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_text_input(p_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove potential XSS characters and normalize
  RETURN regexp_replace(
    regexp_replace(p_input, '[<>&"'']', '', 'g'),
    '\s+', ' ', 'g'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_file_type(p_filename text, p_content_type text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Only allow specific image types
  IF p_content_type NOT IN ('image/jpeg', 'image/png', 'image/webp') THEN
    RETURN false;
  END IF;
  
  -- Check file extension
  IF NOT (p_filename ~* '\.(jpg|jpeg|png|webp)$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Service role has full access to profiles"
ON public.profiles
USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sellers table
CREATE POLICY "Sellers can view own record"
ON public.sellers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sellers can update own record"
ON public.sellers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seller record"
ON public.sellers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sellers"
ON public.sellers
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Service role has full access to sellers"
ON public.sellers
USING (auth.jwt()->>'role' = 'service_role');

-- Enhanced RLS Policies for cars table
CREATE POLICY "Sellers can view own cars"
ON public.cars
FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own cars"
ON public.cars
FOR INSERT
WITH CHECK (
  auth.uid() = seller_id AND 
  public.is_seller() AND
  -- Validate VIN if provided
  (vin IS NULL OR public.validate_vin(vin))
);

CREATE POLICY "Sellers can update own cars"
ON public.cars
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (
  auth.uid() = seller_id AND
  -- Validate VIN if being updated
  (vin IS NULL OR public.validate_vin(vin))
);

CREATE POLICY "Sellers can delete own cars"
ON public.cars
FOR DELETE
USING (auth.uid() = seller_id);

CREATE POLICY "Public can view available cars"
ON public.cars
FOR SELECT
USING (status = 'available' AND is_draft = false);

CREATE POLICY "Admins can manage all cars"
ON public.cars
USING (public.is_admin());

CREATE POLICY "Service role has full access to cars"
ON public.cars
USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for car_file_uploads table
CREATE POLICY "Users can view uploads for own cars"
ON public.car_file_uploads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = car_file_uploads.car_id
    AND cars.seller_id = auth.uid()
  )
);

CREATE POLICY "Users can insert uploads for own cars"
ON public.car_file_uploads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = car_file_uploads.car_id
    AND cars.seller_id = auth.uid()
  ) AND
  -- Validate file type
  public.validate_file_type(file_path, file_type)
);

CREATE POLICY "Users can update uploads for own cars"
ON public.car_file_uploads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = car_file_uploads.car_id
    AND cars.seller_id = auth.uid()
  )
);

CREATE POLICY "Users can delete uploads for own cars"
ON public.car_file_uploads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.cars
    WHERE cars.id = car_file_uploads.car_id
    AND cars.seller_id = auth.uid()
  )
);

CREATE POLICY "Service role has full access to uploads"
ON public.car_file_uploads
USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for vin_reservations table
CREATE POLICY "Users can view own reservations"
ON public.vin_reservations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reservations"
ON public.vin_reservations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  public.validate_vin(vin)
);

CREATE POLICY "Users can update own reservations"
ON public.vin_reservations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to reservations"
ON public.vin_reservations
USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for system_logs table
CREATE POLICY "Admins can view all logs"
ON public.system_logs
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Service role has full access to logs"
ON public.system_logs
USING (auth.jwt()->>'role' = 'service_role');

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits"
ON public.rate_limits
USING (auth.jwt()->>'role' = 'service_role');

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb,
  ip_address inet,
  user_agent text,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
ON public.security_audit_logs
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Service role manages security logs"
ON public.security_audit_logs
USING (auth.jwt()->>'role' = 'service_role');

-- Enhanced file upload security function
CREATE OR REPLACE FUNCTION public.secure_file_upload_check(
  p_file_size bigint,
  p_file_type text,
  p_filename text,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_size_mb constant integer := 10;
  v_max_size_bytes constant bigint := v_max_size_mb * 1024 * 1024;
BEGIN
  -- Check file size
  IF p_file_size > v_max_size_bytes THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('File size %s MB exceeds maximum allowed size of %s MB', 
        round(p_file_size::numeric / 1024 / 1024, 2), v_max_size_mb)
    );
  END IF;
  
  -- Check file type
  IF NOT public.validate_file_type(p_filename, p_file_type) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
    );
  END IF;
  
  -- Check rate limiting (max 20 uploads per hour per user)
  IF EXISTS (
    SELECT 1 FROM public.car_file_uploads
    WHERE created_at > now() - interval '1 hour'
    AND EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_file_uploads.car_id
      AND cars.seller_id = p_user_id
    )
    GROUP BY car_id
    HAVING count(*) >= 20
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Upload rate limit exceeded. Maximum 20 uploads per hour'
    );
  END IF;
  
  RETURN jsonb_build_object('valid', true);
END;
$$;

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_ip_address inet,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz := now() - (p_window_minutes * interval '1 minute');
BEGIN
  -- Count requests in the current window
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_current_count
  FROM public.rate_limits
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
  AND endpoint = p_endpoint
  AND window_start > v_window_start;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Update or insert rate limit record
  INSERT INTO public.rate_limits (user_id, ip_address, endpoint, request_count, window_start)
  VALUES (p_user_id, p_ip_address, p_endpoint, 1, now())
  ON CONFLICT (user_id, endpoint, date_trunc('hour', window_start))
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    created_at = now();
  
  RETURN true;
END;
$$;

-- Security audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_severity text DEFAULT 'medium'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_data,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_data,
    p_ip_address,
    p_user_agent,
    p_severity
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_seller() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_vin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sanitize_text_input(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_file_type(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_file_upload_check(bigint, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, inet, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_security_event(uuid, text, jsonb, inet, text, text) TO service_role;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type, created_at);

COMMENT ON TABLE public.rate_limits IS 'Rate limiting tracking for API endpoints';
COMMENT ON TABLE public.security_audit_logs IS 'Security event logging for audit purposes';
