
/**
 * Migration: Improve handling of required_photos JSONB structure and error handling
 * Created: 2025-06-01
 * 
 * Changes:
 * - Add explicit handling for the required_photos JSONB field
 * - Remove references to non-existent "has_tool_pack" field
 * - Enhance error handling with more detailed reporting
 * - Add validation for JSONB structure
 */

-- Update the create_car_listing function to properly handle the required_photos field
CREATE OR REPLACE FUNCTION public.create_car_listing(
  p_car_data jsonb,
  p_user_id uuid DEFAULT auth.uid()
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_car_id uuid;
  v_log_id text := gen_random_uuid()::text;
  v_updated_data jsonb;
  v_is_seller boolean;
  v_validation_errors jsonb := '[]'::jsonb;
BEGIN
  -- Log operation start
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Starting car listing security definer function', 
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
    
    -- Log auto-fix
    INSERT INTO system_logs (
      log_type, 
      message, 
      details, 
      correlation_id
    ) VALUES (
      'car_listing', 
      'Auto-fixed missing seller record', 
      jsonb_build_object('user_id', p_user_id),
      v_log_id
    );
  END IF;

  -- Basic validation of required fields
  IF p_car_data->>'make' IS NULL THEN
    v_validation_errors := v_validation_errors || jsonb_build_object('field', 'make', 'message', 'Make is required');
  END IF;
  
  IF p_car_data->>'model' IS NULL THEN
    v_validation_errors := v_validation_errors || jsonb_build_object('field', 'model', 'message', 'Model is required');
  END IF;
  
  -- Check if JSONB structure is valid for required_photos
  IF p_car_data->'required_photos' IS NOT NULL AND 
     jsonb_typeof(p_car_data->'required_photos') != 'object' THEN
    v_validation_errors := v_validation_errors || 
      jsonb_build_object('field', 'required_photos', 'message', 'Required photos must be a valid JSON object');
      
    -- Log the validation error specifically for JSONB structure
    INSERT INTO system_logs (
      log_type, 
      message, 
      details, 
      correlation_id
    ) VALUES (
      'car_listing_validation', 
      'Invalid JSONB structure for required_photos', 
      jsonb_build_object(
        'user_id', p_user_id,
        'provided_type', jsonb_typeof(p_car_data->'required_photos')
      ),
      v_log_id
    );
  END IF;

  -- Return validation errors if any
  IF jsonb_array_length(v_validation_errors) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'validation_errors', v_validation_errors,
      'message', 'Validation failed'
    );
  END IF;

  -- Prepare data with ensured seller_id
  v_updated_data := p_car_data || jsonb_build_object('seller_id', p_user_id);
  
  -- Check if car exists with this ID
  IF (v_updated_data->>'id') IS NOT NULL THEN
    v_car_id := (v_updated_data->>'id')::uuid;
    
    -- Update existing car
    UPDATE public.cars
    SET 
      seller_id = v_updated_data->>'seller_id',
      -- FIX: Accept either name or seller_name to support both field mappings
      seller_name = COALESCE(v_updated_data->>'seller_name', v_updated_data->>'name'),
      address = v_updated_data->>'address',
      mobile_number = v_updated_data->>'mobile_number',
      features = v_updated_data->'features',
      is_damaged = (v_updated_data->>'is_damaged')::boolean,
      is_registered_in_poland = (v_updated_data->>'is_registered_in_poland')::boolean,
      has_documentation = (v_updated_data->>'has_documentation')::boolean,
      is_selling_on_behalf = (v_updated_data->>'is_selling_on_behalf')::boolean,
      has_private_plate = (v_updated_data->>'has_private_plate')::boolean,
      finance_amount = (v_updated_data->>'finance_amount')::numeric,
      service_history_type = v_updated_data->>'service_history_type',
      seller_notes = v_updated_data->>'seller_notes',
      seat_material = v_updated_data->>'seat_material',
      number_of_keys = (v_updated_data->>'number_of_keys')::integer,
      is_draft = (v_updated_data->>'is_draft')::boolean,
      updated_at = now(),
      mileage = (v_updated_data->>'mileage')::integer,
      price = (v_updated_data->>'price')::numeric,
      title = v_updated_data->>'title',
      vin = v_updated_data->>'vin',
      transmission = v_updated_data->>'transmission',
      required_photos = v_updated_data->'required_photos',
      additional_photos = v_updated_data->'additional_photos',
      form_metadata = v_updated_data->'form_metadata',
      make = v_updated_data->>'make',
      model = v_updated_data->>'model',
      year = (v_updated_data->>'year')::integer,
      valuation_data = v_updated_data->'valuation_data'
    WHERE id = v_car_id
    RETURNING id INTO v_car_id;
  ELSE
    -- Create new car
    INSERT INTO public.cars (
      seller_id,
      seller_name,
      address,
      mobile_number,
      features,
      is_damaged,
      is_registered_in_poland,
      has_documentation,
      is_selling_on_behalf,
      has_private_plate,
      finance_amount,
      service_history_type,
      seller_notes,
      seat_material,
      number_of_keys,
      is_draft,
      updated_at,
      mileage,
      price,
      title,
      vin,
      transmission,
      required_photos,
      additional_photos,
      form_metadata,
      make,
      model,
      year,
      valuation_data
    ) VALUES (
      (v_updated_data->>'seller_id')::uuid,
      -- FIX: Accept either name or seller_name to support both field mappings
      COALESCE(v_updated_data->>'seller_name', v_updated_data->>'name'),
      v_updated_data->>'address',
      v_updated_data->>'mobile_number',
      v_updated_data->'features',
      (v_updated_data->>'is_damaged')::boolean,
      (v_updated_data->>'is_registered_in_poland')::boolean,
      (v_updated_data->>'has_documentation')::boolean,
      (v_updated_data->>'is_selling_on_behalf')::boolean,
      (v_updated_data->>'has_private_plate')::boolean,
      (v_updated_data->>'finance_amount')::numeric,
      v_updated_data->>'service_history_type',
      v_updated_data->>'seller_notes',
      v_updated_data->>'seat_material',
      (v_updated_data->>'number_of_keys')::integer,
      (v_updated_data->>'is_draft')::boolean,
      now(),
      (v_updated_data->>'mileage')::integer,
      (v_updated_data->>'price')::numeric,
      v_updated_data->>'title',
      v_updated_data->>'vin',
      v_updated_data->>'transmission',
      v_updated_data->'required_photos',
      v_updated_data->'additional_photos',
      v_updated_data->'form_metadata',
      v_updated_data->>'make',
      v_updated_data->>'model',
      (v_updated_data->>'year')::integer,
      v_updated_data->'valuation_data'
    )
    RETURNING id INTO v_car_id;
  END IF;

  -- Log successful completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Completed car listing security definer function', 
    jsonb_build_object('user_id', p_user_id, 'car_id', v_car_id),
    v_log_id
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'car_id', v_car_id
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error with more detailed information
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
      'error_state', SQLSTATE,
      'error_hint', COALESCE(PG_EXCEPTION_HINT, 'No hint available'),
      'error_detail', COALESCE(PG_EXCEPTION_DETAIL, 'No detail available'),
      'error_context', COALESCE(PG_EXCEPTION_CONTEXT, 'No context available')
    ),
    SQLERRM,
    v_log_id
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.create_car_listing TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_car_listing TO service_role;

-- Comment on function for clarity
COMMENT ON FUNCTION public.create_car_listing IS 
  'Security definer function to safely create car listings while bypassing RLS, with improved JSONB handling';

