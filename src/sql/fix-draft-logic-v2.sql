
-- Fix the enforce_car_ownership_integrity function to remove the incompatible jsonb operator
-- and complete the draft logic removal

-- First, fix the problematic function
CREATE OR REPLACE FUNCTION public.enforce_car_ownership_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- If seller_id is being changed on a non-draft car, prevent the change
  IF OLD.seller_id IS NOT NULL AND NEW.seller_id != OLD.seller_id AND OLD.is_draft = FALSE THEN
    RAISE EXCEPTION 'Cannot change ownership of a published car listing (ID: %)', OLD.id
      USING HINT = 'Car listings that are no longer drafts must maintain their original ownership.';
  END IF;

  -- Record the change in history table with proper jsonb handling
  INSERT INTO public.cars_history(
    car_id,
    seller_id,
    status,
    is_draft,
    previous_status,
    changed_by,
    change_type,
    metadata
  ) VALUES (
    NEW.id,
    NEW.seller_id,
    NEW.status,
    NEW.is_draft,
    OLD.status,
    auth.uid(),
    CASE 
      WHEN OLD.is_draft = TRUE AND NEW.is_draft = FALSE THEN 'published'
      WHEN OLD.status != NEW.status THEN 'status_changed'
      WHEN OLD.seller_id != NEW.seller_id THEN 'ownership_changed'
      ELSE 'updated'
    END,
    jsonb_build_object(
      'old_seller_id', OLD.seller_id,
      'new_seller_id', NEW.seller_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_is_draft', OLD.is_draft,
      'new_is_draft', NEW.is_draft
    )
  );

  RETURN NEW;
END;
$function$;

-- Now run the original migration commands
-- Update all draft cars to be available
UPDATE cars 
SET 
  is_draft = false,
  status = 'available',
  updated_at = NOW()
WHERE is_draft = true;

-- Update the create_car_listing function to never create drafts
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
BEGIN
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Starting immediate car listing creation', 
    jsonb_build_object('user_id', p_user_id),
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
  END IF;

  -- Prepare data with ensured seller_id and NEVER draft
  v_updated_data := p_car_data || jsonb_build_object(
    'seller_id', p_user_id,
    'is_draft', false,
    'status', 'available'
  );
  
  -- Check if car exists with this ID
  IF (v_updated_data->>'id') IS NOT NULL THEN
    v_car_id := (v_updated_data->>'id')::uuid;
    
    -- Update existing car - ALWAYS available
    UPDATE public.cars
    SET 
      seller_id = v_updated_data->>'seller_id',
      seller_name = COALESCE(v_updated_data->>'seller_name', v_updated_data->>'name'),
      address = v_updated_data->>'address',
      mobile_number = v_updated_data->>'mobile_number',
      features = v_updated_data->'features',
      is_damaged = (v_updated_data->>'is_damaged')::boolean,
      is_registered_in_poland = (v_updated_data->>'is_registered_in_poland')::boolean,
      has_private_plate = (v_updated_data->>'has_private_plate')::boolean,
      finance_amount = (v_updated_data->>'finance_amount')::numeric,
      service_history_type = v_updated_data->>'service_history_type',
      seller_notes = v_updated_data->>'seller_notes',
      seat_material = v_updated_data->>'seat_material',
      number_of_keys = (v_updated_data->>'number_of_keys')::integer,
      is_draft = false, -- NEVER draft
      status = 'available', -- ALWAYS available
      last_saved = now(),
      mileage = (v_updated_data->>'mileage')::integer,
      price = (v_updated_data->>'price')::numeric,
      title = v_updated_data->>'title',
      vin = v_updated_data->>'vin',
      transmission = v_updated_data->>'transmission',
      additional_photos = v_updated_data->'additional_photos',
      form_metadata = v_updated_data->'form_metadata',
      make = v_updated_data->>'make',
      model = v_updated_data->>'model',
      year = (v_updated_data->>'year')::integer,
      valuation_data = v_updated_data->'valuation_data',
      required_photos = v_updated_data->'required_photos',
      updated_at = now()
    WHERE id = v_car_id
    RETURNING id INTO v_car_id;
  ELSE
    -- Create new car - ALWAYS available
    INSERT INTO public.cars (
      seller_id,
      seller_name,
      address,
      mobile_number,
      features,
      is_damaged,
      is_registered_in_poland,
      has_private_plate,
      finance_amount,
      service_history_type,
      seller_notes,
      seat_material,
      number_of_keys,
      is_draft, -- NEVER draft
      status, -- ALWAYS available
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
      valuation_data,
      required_photos
    ) VALUES (
      (v_updated_data->>'seller_id')::uuid,
      COALESCE(v_updated_data->>'seller_name', v_updated_data->>'name'),
      v_updated_data->>'address',
      v_updated_data->>'mobile_number',
      v_updated_data->'features',
      (v_updated_data->>'is_damaged')::boolean,
      (v_updated_data->>'is_registered_in_poland')::boolean,
      (v_updated_data->>'has_private_plate')::boolean,
      (v_updated_data->>'finance_amount')::numeric,
      v_updated_data->>'service_history_type',
      v_updated_data->>'seller_notes',
      v_updated_data->>'seat_material',
      (v_updated_data->>'number_of_keys')::integer,
      false, -- NEVER draft
      'available', -- ALWAYS available
      now(),
      (v_updated_data->>'mileage')::integer,
      (v_updated_data->>'price')::numeric,
      v_updated_data->>'title',
      v_updated_data->>'vin',
      v_updated_data->>'transmission',
      v_updated_data->'additional_photos',
      v_updated_data->'form_metadata',
      v_updated_data->>'make',
      v_updated_data->>'model',
      (v_updated_data->>'year')::integer,
      v_updated_data->'valuation_data',
      v_updated_data->'required_photos'
    )
    RETURNING id INTO v_car_id;
  END IF;

  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Completed immediate car listing creation', 
    jsonb_build_object('user_id', p_user_id, 'car_id', v_car_id),
    v_log_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'car_id', v_car_id
  );
EXCEPTION WHEN OTHERS THEN
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    error_message,
    correlation_id
  ) VALUES (
    'car_listing_error', 
    'Error in immediate car listing creation', 
    jsonb_build_object('user_id', p_user_id),
    SQLERRM,
    v_log_id
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- Clean up any orphaned image records that might be causing issues
DELETE FROM car_file_uploads 
WHERE car_id NOT IN (SELECT id FROM cars);
