
-- Add security definer function for checking VIN reservations without direct table access
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
BEGIN
  -- Find active reservation for this VIN and user
  SELECT *
  INTO v_reservation
  FROM public.vin_reservations
  WHERE vin = p_vin
    AND user_id = p_user_id
    AND status = 'active';
  
  -- If no reservation exists
  IF v_reservation IS NULL THEN
    RETURN jsonb_build_object(
      'exists', false,
      'message', 'No active reservation found for this VIN'
    );
  END IF;
  
  -- Check if reservation has expired
  IF v_reservation.expires_at < NOW() THEN
    -- Update the reservation status to expired
    UPDATE public.vin_reservations
    SET status = 'expired'
    WHERE id = v_reservation.id;
    
    RETURN jsonb_build_object(
      'exists', false,
      'message', 'Reservation has expired'
    );
  END IF;
  
  -- Reservation is valid
  RETURN jsonb_build_object(
    'exists', true,
    'reservation', jsonb_build_object(
      'id', v_reservation.id,
      'vin', v_reservation.vin,
      'expires_at', v_reservation.expires_at
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error and return failure response
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message
  ) VALUES (
    'vin_check_error', 
    'Error checking VIN reservation', 
    SQLERRM
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_vin_reservation TO authenticated;
