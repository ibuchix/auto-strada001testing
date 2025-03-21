
-- Comprehensive migration to fix various permission and TypeScript isolation issues

-- First, enhance the vin_valuation_cache table permissions
ALTER TABLE IF EXISTS public.vin_valuation_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read from the cache
CREATE POLICY IF NOT EXISTS "Authenticated users can read cache"
ON public.vin_valuation_cache
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policy to allow service role full access
CREATE POLICY IF NOT EXISTS "Service role has full access to cache"
ON public.vin_valuation_cache
USING (auth.role() = 'service_role');

-- Create policy to allow authenticated users to use INSERT via security definer function
CREATE POLICY IF NOT EXISTS "Authenticated users can insert via security definer"
ON public.vin_valuation_cache
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create policies to allow sellers to manage their cars
ALTER TABLE IF EXISTS public.cars ENABLE ROW LEVEL SECURITY;

-- Allow sellers to select their own cars
CREATE POLICY IF NOT EXISTS "Sellers can view their own cars"
ON public.cars
FOR SELECT
USING (auth.uid() = seller_id);

-- Allow sellers to insert their own cars
CREATE POLICY IF NOT EXISTS "Sellers can insert their own cars"
ON public.cars
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Allow sellers to update their own cars
CREATE POLICY IF NOT EXISTS "Sellers can update their own cars"
ON public.cars
FOR UPDATE
USING (auth.uid() = seller_id);

-- Enhance the create_car_listing function from the previous migration
-- to handle special cases
CREATE OR REPLACE FUNCTION public.create_car_listing(
  p_car_data jsonb,
  p_user_id uuid DEFAULT auth.uid()
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_car_id uuid;
  v_log_id text := gen_random_uuid()::text;
  v_updated_data jsonb;
  v_is_seller boolean;
  v_start_time timestamptz := clock_timestamp();
BEGIN
  -- Ensure this can only be executed for the current user
  -- or a service role
  IF p_user_id != auth.uid() AND auth.jwt()->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Not authorized to create listings for other users';
  END IF;

  -- Log operation start with timing
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Starting car listing security definer function', 
    jsonb_build_object('user_id', p_user_id, 'start_time', v_start_time),
    v_log_id
  );

  -- Verify user is a seller
  SELECT EXISTS (
    SELECT 1 FROM public.sellers 
    WHERE user_id = p_user_id
  ) INTO v_is_seller;
  
  IF NOT v_is_seller THEN
    -- Auto-fix: Create sellers record if missing
    INSERT INTO public.sellers (
      user_id, 
      created_at, 
      updated_at, 
      verification_status, 
      is_verified
    ) VALUES (
      p_user_id, 
      now(), 
      now(), 
      'verified', 
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Auto-fix: Also ensure profile has seller role
    INSERT INTO public.profiles (
      id,
      role,
      updated_at
    ) VALUES (
      p_user_id,
      'seller',
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'seller', updated_at = now();
    
    -- Log auto-fix
    INSERT INTO system_logs (
      log_type, 
      message, 
      details, 
      correlation_id
    ) VALUES (
      'car_listing', 
      'Auto-fixed missing seller record and/or profile', 
      jsonb_build_object('user_id', p_user_id),
      v_log_id
    );
  END IF;

  -- Prepare data with ensured seller_id
  v_updated_data := p_car_data || jsonb_build_object('seller_id', p_user_id);
  
  -- Check if car exists with this ID
  IF (v_updated_data->>'id') IS NOT NULL AND (v_updated_data->>'id') != '' THEN
    v_car_id := (v_updated_data->>'id')::uuid;
    
    -- Update existing car
    UPDATE public.cars
    SET 
      seller_id = p_user_id,
      name = v_updated_data->>'name',
      address = v_updated_data->>'address',
      mobile_number = v_updated_data->>'mobile_number',
      features = v_updated_data->'features',
      is_damaged = (v_updated_data->>'is_damaged')::boolean,
      is_registered_in_poland = (v_updated_data->>'is_registered_in_poland')::boolean,
      has_tool_pack = (v_updated_data->>'has_tool_pack')::boolean,
      has_documentation = (v_updated_data->>'has_documentation')::boolean,
      is_selling_on_behalf = (v_updated_data->>'is_selling_on_behalf')::boolean,
      has_private_plate = (v_updated_data->>'has_private_plate')::boolean,
      finance_amount = NULLIF(v_updated_data->>'finance_amount', '')::numeric,
      service_history_type = v_updated_data->>'service_history_type',
      seller_notes = v_updated_data->>'seller_notes',
      seat_material = v_updated_data->>'seat_material',
      number_of_keys = NULLIF(v_updated_data->>'number_of_keys', '')::integer,
      is_draft = (v_updated_data->>'is_draft')::boolean,
      last_saved = now(),
      mileage = NULLIF(v_updated_data->>'mileage', '')::integer,
      price = NULLIF(v_updated_data->>'price', '')::numeric,
      title = v_updated_data->>'title',
      vin = v_updated_data->>'vin',
      transmission = v_updated_data->>'transmission',
      additional_photos = v_updated_data->'additional_photos',
      form_metadata = v_updated_data->'form_metadata',
      make = v_updated_data->>'make',
      model = v_updated_data->>'model',
      year = NULLIF(v_updated_data->>'year', '')::integer,
      valuation_data = v_updated_data->'valuation_data'
    WHERE id = v_car_id
    RETURNING id INTO v_car_id;
  ELSE
    -- Create new car
    INSERT INTO public.cars (
      seller_id,
      name,
      address,
      mobile_number,
      features,
      is_damaged,
      is_registered_in_poland,
      has_tool_pack,
      has_documentation,
      is_selling_on_behalf,
      has_private_plate,
      finance_amount,
      service_history_type,
      seller_notes,
      seat_material,
      number_of_keys,
      is_draft,
      last_saved,
      mileage,
      price,
      title,
      vin,
      transmission,
      additional_photos,
      form_metadata,
      make,
      model,
      year,
      valuation_data
    ) VALUES (
      p_user_id,
      v_updated_data->>'name',
      v_updated_data->>'address',
      v_updated_data->>'mobile_number',
      v_updated_data->'features',
      (v_updated_data->>'is_damaged')::boolean,
      (v_updated_data->>'is_registered_in_poland')::boolean,
      (v_updated_data->>'has_tool_pack')::boolean,
      (v_updated_data->>'has_documentation')::boolean,
      (v_updated_data->>'is_selling_on_behalf')::boolean,
      (v_updated_data->>'has_private_plate')::boolean,
      NULLIF(v_updated_data->>'finance_amount', '')::numeric,
      v_updated_data->>'service_history_type',
      v_updated_data->>'seller_notes',
      v_updated_data->>'seat_material',
      NULLIF(v_updated_data->>'number_of_keys', '')::integer,
      (v_updated_data->>'is_draft')::boolean,
      now(),
      NULLIF(v_updated_data->>'mileage', '')::integer,
      NULLIF(v_updated_data->>'price', '')::numeric,
      v_updated_data->>'title',
      v_updated_data->>'vin',
      v_updated_data->>'transmission',
      v_updated_data->'additional_photos',
      v_updated_data->'form_metadata',
      v_updated_data->>'make',
      v_updated_data->>'model',
      NULLIF(v_updated_data->>'year', '')::integer,
      v_updated_data->'valuation_data'
    )
    RETURNING id INTO v_car_id;
  END IF;

  -- Calculate duration and log successful completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Completed car listing security definer function', 
    jsonb_build_object(
      'user_id', p_user_id, 
      'car_id', v_car_id,
      'duration_ms', extract(epoch from (clock_timestamp() - v_start_time)) * 1000
    ),
    v_log_id
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'car_id', v_car_id
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error with details
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    error_message,
    correlation_id
  ) VALUES (
    'car_listing_error', 
    'Error in car listing security definer function', 
    jsonb_build_object(
      'user_id', p_user_id,
      'duration_ms', extract(epoch from (clock_timestamp() - v_start_time)) * 1000,
      'error_code', SQLSTATE
    ),
    SQLERRM,
    v_log_id
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- Create a user verification fixer function to ensure sellers are properly registered
CREATE OR REPLACE FUNCTION public.ensure_seller_status(
  p_user_id uuid DEFAULT auth.uid()
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id text := gen_random_uuid()::text;
  v_has_profile boolean;
  v_has_seller boolean;
  v_profile_role text;
  v_seller_verified boolean;
BEGIN
  -- Check current status
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id
  ) INTO v_has_profile;

  SELECT role INTO v_profile_role FROM public.profiles WHERE id = p_user_id;

  SELECT EXISTS (
    SELECT 1 FROM public.sellers WHERE user_id = p_user_id
  ) INTO v_has_seller;

  SELECT is_verified INTO v_seller_verified 
  FROM public.sellers WHERE user_id = p_user_id;

  -- Auto-fix: Create or update profile if needed
  IF NOT v_has_profile OR v_profile_role != 'seller' THEN
    INSERT INTO public.profiles (
      id, role, updated_at
    ) VALUES (
      p_user_id, 'seller', now()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'seller', updated_at = now();
  END IF;

  -- Auto-fix: Create or update seller record if needed
  IF NOT v_has_seller OR NOT v_seller_verified THEN
    INSERT INTO public.sellers (
      user_id, created_at, updated_at, verification_status, is_verified
    ) VALUES (
      p_user_id, now(), now(), 'verified', true
    )
    ON CONFLICT (user_id) DO UPDATE
    SET verification_status = 'verified', is_verified = true, updated_at = now();
  END IF;

  -- Return status
  RETURN jsonb_build_object(
    'success', true,
    'profile_fixed', NOT v_has_profile OR v_profile_role != 'seller',
    'seller_fixed', NOT v_has_seller OR NOT v_seller_verified
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_seller_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_seller_status TO service_role;

COMMENT ON FUNCTION public.ensure_seller_status IS 
  'Security definer function to ensure a user has proper seller status';
