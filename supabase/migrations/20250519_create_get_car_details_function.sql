
-- Create a security definer function for fetching car details
CREATE OR REPLACE FUNCTION public.get_car_details(p_car_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_car_data jsonb;
BEGIN
  -- Check if the user is the owner of the car
  SELECT to_jsonb(cars)
  INTO v_car_data
  FROM cars
  WHERE id = p_car_id AND seller_id = p_user_id;
  
  -- Return the car data (will be NULL if not found or not owner)
  RETURN v_car_data;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.get_car_details(uuid, uuid) IS 'Get car details for a specific seller safely bypassing RLS';

-- Create an RPC wrapper for easier fetch from client code
-- This function will be callable from the client using supabase.rpc('fetch_car_details', { car_id: 'xxx' })
CREATE OR REPLACE FUNCTION public.fetch_car_details(p_car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_car_details(p_car_id, auth.uid());
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.fetch_car_details(uuid) IS 'Get car details for the current authenticated user safely bypassing RLS';
