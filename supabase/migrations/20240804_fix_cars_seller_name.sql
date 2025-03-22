
-- Migration to update the cars table to handle seller name correctly
-- This adds a seller_name column to the cars table and updates the create_car_listing function

-- First, add the seller_name column to the cars table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars' 
        AND column_name = 'seller_name'
    ) THEN
        ALTER TABLE public.cars ADD COLUMN seller_name text;
        COMMENT ON COLUMN public.cars.seller_name IS 'Name of the seller';
    END IF;
END
$$;

-- Update the create_car_listing function to handle seller_name instead of name
CREATE OR REPLACE FUNCTION public.create_car_listing(p_car_data jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Update existing car - now using seller_name
    UPDATE public.cars
    SET 
      seller_id = p_user_id,
      seller_name = v_updated_data->>'seller_name',
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
    -- Create new car - now using seller_name
    INSERT INTO public.cars (
      seller_id,
      seller_name,
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
      v_updated_data->>'seller_name',
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
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_car_listing TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_car_listing TO service_role;
