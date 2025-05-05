
-- Create security definer functions for VIN reservations to avoid permissions issues

-- Function to create/update VIN reservation
CREATE OR REPLACE FUNCTION public.create_vin_reservation(
  p_vin text,
  p_user_id uuid,
  p_valuation_data jsonb DEFAULT NULL,
  p_duration_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamptz;
  v_reservation_id uuid;
  v_is_new boolean := false;
BEGIN
  -- Input validation
  IF p_vin IS NULL OR length(p_vin) < 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid VIN format'
    );
  END IF;
  
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User ID is required'
    );
  END IF;
  
  -- Calculate expiration time
  v_expires_at := now() + (p_duration_minutes * interval '1 minute');
  
  -- Check if reservation exists for this user
  SELECT id INTO v_reservation_id
  FROM public.vin_reservations
  WHERE vin = p_vin 
    AND user_id = p_user_id
    AND status = 'active';
  
  IF v_reservation_id IS NOT NULL THEN
    -- Update existing reservation
    UPDATE public.vin_reservations
    SET 
      expires_at = v_expires_at,
      valuation_data = COALESCE(p_valuation_data, valuation_data)
    WHERE id = v_reservation_id
    RETURNING id INTO v_reservation_id;
  ELSE
    -- Create new reservation
    INSERT INTO public.vin_reservations(
      vin,
      user_id,
      status,
      expires_at,
      valuation_data
    ) VALUES (
      p_vin,
      p_user_id,
      'active',
      v_expires_at,
      p_valuation_data
    )
    RETURNING id INTO v_reservation_id;
    
    v_is_new := true;
  END IF;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'reservationId', v_reservation_id,
    'expiresAt', v_expires_at,
    'isNew', v_is_new
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO system_logs(
    log_type, 
    message, 
    error_message
  ) VALUES (
    'reservation_error',
    'Error in create_vin_reservation',
    SQLERRM
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Function to check VIN reservation
CREATE OR REPLACE FUNCTION public.check_vin_reservation(
  p_vin text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation record;
  v_time_remaining interval;
BEGIN
  -- Get active reservation
  SELECT * INTO v_reservation
  FROM public.vin_reservations
  WHERE vin = p_vin
    AND user_id = p_user_id
    AND status = 'active';
  
  -- Check if reservation exists
  IF v_reservation IS NULL THEN
    RETURN jsonb_build_object(
      'exists', false,
      'message', 'No active reservation found'
    );
  END IF;
  
  -- Check if expired
  IF v_reservation.expires_at < now() THEN
    -- Update status to expired
    UPDATE public.vin_reservations
    SET status = 'expired'
    WHERE id = v_reservation.id;
    
    RETURN jsonb_build_object(
      'exists', false,
      'wasExpired', true,
      'message', 'Reservation has expired'
    );
  END IF;
  
  -- Calculate time remaining
  v_time_remaining := v_reservation.expires_at - now();
  
  -- Return reservation details
  RETURN jsonb_build_object(
    'exists', true,
    'reservation', jsonb_build_object(
      'id', v_reservation.id,
      'vin', v_reservation.vin,
      'expiresAt', v_reservation.expires_at,
      'valuationData', v_reservation.valuation_data,
      'timeRemaining', extract(epoch from v_time_remaining)
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Function to extend VIN reservation
CREATE OR REPLACE FUNCTION public.extend_vin_reservation(
  p_vin text,
  p_user_id uuid,
  p_duration_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamptz;
  v_reservation_id uuid;
BEGIN
  -- Calculate new expiration time
  v_expires_at := now() + (p_duration_minutes * interval '1 minute');
  
  -- Update reservation
  UPDATE public.vin_reservations
  SET expires_at = v_expires_at
  WHERE vin = p_vin
    AND user_id = p_user_id
    AND status = 'active'
  RETURNING id INTO v_reservation_id;
  
  -- Check if reservation was found
  IF v_reservation_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active reservation found'
    );
  END IF;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'reservationId', v_reservation_id,
    'expiresAt', v_expires_at
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Function to cancel VIN reservation
CREATE OR REPLACE FUNCTION public.cancel_vin_reservation(
  p_vin text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id uuid;
BEGIN
  -- Update reservation status
  UPDATE public.vin_reservations
  SET status = 'cancelled'
  WHERE vin = p_vin
    AND user_id = p_user_id
    AND status = 'active'
  RETURNING id INTO v_reservation_id;
  
  -- Check if reservation was found
  IF v_reservation_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active reservation found'
    );
  END IF;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'reservationId', v_reservation_id,
    'message', 'Reservation cancelled successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_vin_reservation TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_vin_reservation TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.extend_vin_reservation TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_vin_reservation TO anon, authenticated, service_role;

-- Update RLS policies to ensure they don't create circular dependencies with profiles table
ALTER TABLE public.vin_reservations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.vin_reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON public.vin_reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.vin_reservations;
DROP POLICY IF EXISTS "Users can delete their own reservations" ON public.vin_reservations;

-- Create simple policies that don't access other tables
CREATE POLICY "Users can view their own reservations" 
ON public.vin_reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations" 
ON public.vin_reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.vin_reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations" 
ON public.vin_reservations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure service_role has full access
CREATE POLICY "Service role has full access to reservations"
ON public.vin_reservations
USING (auth.jwt() ->> 'role' = 'service_role');
