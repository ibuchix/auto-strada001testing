
/**
 * Changes made:
 * - 2025-05-29: Created security definer function for car listings
 * - 2025-05-30: Fixed function to accept both "name" and "seller_name" fields
 *   to handle different client implementations consistently
 * - 2025-05-30: Enhanced error handling and logging to prevent silent failures
 * - 2025-05-30: Fixed car ID return logic to ensure proper ID extraction
 */

-- Update the create_car_listing function with enhanced error handling and logging
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
  v_existing_car_id uuid;
  v_insert_success boolean := false;
BEGIN
  -- Log operation start with request data
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Starting car listing security definer function', 
    jsonb_build_object(
      'user_id', p_user_id,
      'has_car_data', (p_car_data IS NOT NULL),
      'car_data_keys', CASE WHEN p_car_data IS NOT NULL THEN jsonb_object_keys(p_car_data) ELSE NULL END
    ),
    v_log_id
  );

  -- Validate input data
  IF p_car_data IS NULL THEN
    INSERT INTO system_logs (
      log_type, 
      message, 
      error_message,
      correlation_id
    ) VALUES (
      'car_listing_error', 
      'Invalid input: car data is null', 
      'Car data cannot be null',
      v_log_id
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Car data cannot be null'
    );
  END IF;

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

  -- Prepare data with ensured seller_id
  v_updated_data := p_car_data || jsonb_build_object('seller_id', p_user_id);
  
  -- Log the data we're about to process
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Processing car data', 
    jsonb_build_object(
      'user_id', p_user_id,
      'provided_car_id', v_updated_data->>'id',
      'make', v_updated_data->>'make',
      'model', v_updated_data->>'model',
      'year', v_updated_data->>'year'
    ),
    v_log_id
  );
  
  -- Check if car exists with this ID
  IF (v_updated_data->>'id') IS NOT NULL THEN
    v_existing_car_id := (v_updated_data->>'id')::uuid;
    
    -- Check if the car actually exists
    SELECT id INTO v_car_id FROM public.cars WHERE id = v_existing_car_id;
    
    IF v_car_id IS NOT NULL THEN
      -- Update existing car
      BEGIN
        UPDATE public.cars
        SET 
          seller_id = (v_updated_data->>'seller_id')::uuid,
          seller_name = COALESCE(v_updated_data->>'seller_name', v_updated_data->>'name'),
          address = v_updated_data->>'address',
          mobile_number = v_updated_data->>'mobile_number',
          features = v_updated_data->'features',
          is_damaged = COALESCE((v_updated_data->>'is_damaged')::boolean, false),
          is_registered_in_poland = COALESCE((v_updated_data->>'is_registered_in_poland')::boolean, false),
          has_private_plate = COALESCE((v_updated_data->>'has_private_plate')::boolean, false),
          finance_amount = COALESCE((v_updated_data->>'finance_amount')::numeric, 0),
          service_history_type = COALESCE(v_updated_data->>'service_history_type', 'none'),
          seller_notes = v_updated_data->>'seller_notes',
          seat_material = COALESCE(v_updated_data->>'seat_material', 'cloth'),
          number_of_keys = COALESCE((v_updated_data->>'number_of_keys')::integer, 1),
          status = 'available',
          last_saved = now(),
          mileage = COALESCE((v_updated_data->>'mileage')::integer, 0),
          reserve_price = COALESCE((v_updated_data->>'reserve_price')::numeric, 0),
          title = v_updated_data->>'title',
          vin = v_updated_data->>'vin',
          transmission = COALESCE(v_updated_data->>'transmission', 'manual'),
          additional_photos = COALESCE(v_updated_data->'additional_photos', '[]'::jsonb),
          required_photos = v_updated_data->'required_photos',
          form_metadata = v_updated_data->'form_metadata',
          make = v_updated_data->>'make',
          model = v_updated_data->>'model',
          year = COALESCE((v_updated_data->>'year')::integer, 2000),
          valuation_data = v_updated_data->'valuation_data',
          updated_at = now()
        WHERE id = v_existing_car_id;
        
        GET DIAGNOSTICS v_insert_success = FOUND;
        
        IF v_insert_success THEN
          v_car_id := v_existing_car_id;
          
          INSERT INTO system_logs (
            log_type, 
            message, 
            details, 
            correlation_id
          ) VALUES (
            'car_listing', 
            'Successfully updated existing car', 
            jsonb_build_object('car_id', v_car_id),
            v_log_id
          );
        ELSE
          INSERT INTO system_logs (
            log_type, 
            message, 
            error_message,
            correlation_id
          ) VALUES (
            'car_listing_error', 
            'Failed to update existing car - no rows affected', 
            'UPDATE operation returned no affected rows',
            v_log_id
          );
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO system_logs (
          log_type, 
          message, 
          error_message,
          correlation_id
        ) VALUES (
          'car_listing_error', 
          'Error updating existing car', 
          SQLERRM,
          v_log_id
        );
        
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Failed to update car: ' || SQLERRM
        );
      END;
    ELSE
      -- Car ID provided but doesn't exist, treat as new car creation
      v_car_id := v_existing_car_id;
    END IF;
  ELSE
    -- Generate new car ID
    v_car_id := gen_random_uuid();
  END IF;

  -- If we don't have a successful update, create new car
  IF NOT v_insert_success THEN
    BEGIN
      INSERT INTO public.cars (
        id,
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
        status,
        last_saved,
        mileage,
        reserve_price,
        title,
        vin,
        transmission,
        additional_photos,
        required_photos,
        form_metadata,
        make,
        model,
        year,
        valuation_data,
        created_at,
        updated_at
      ) VALUES (
        v_car_id,
        (v_updated_data->>'seller_id')::uuid,
        COALESCE(v_updated_data->>'seller_name', v_updated_data->>'name'),
        v_updated_data->>'address',
        v_updated_data->>'mobile_number',
        COALESCE(v_updated_data->'features', '{}'::jsonb),
        COALESCE((v_updated_data->>'is_damaged')::boolean, false),
        COALESCE((v_updated_data->>'is_registered_in_poland')::boolean, false),
        COALESCE((v_updated_data->>'has_private_plate')::boolean, false),
        COALESCE((v_updated_data->>'finance_amount')::numeric, 0),
        COALESCE(v_updated_data->>'service_history_type', 'none'),
        v_updated_data->>'seller_notes',
        COALESCE(v_updated_data->>'seat_material', 'cloth'),
        COALESCE((v_updated_data->>'number_of_keys')::integer, 1),
        'available',
        now(),
        COALESCE((v_updated_data->>'mileage')::integer, 0),
        COALESCE((v_updated_data->>'reserve_price')::numeric, 0),
        v_updated_data->>'title',
        v_updated_data->>'vin',
        COALESCE(v_updated_data->>'transmission', 'manual'),
        COALESCE(v_updated_data->'additional_photos', '[]'::jsonb),
        v_updated_data->'required_photos',
        v_updated_data->'form_metadata',
        v_updated_data->>'make',
        v_updated_data->>'model',
        COALESCE((v_updated_data->>'year')::integer, 2000),
        v_updated_data->'valuation_data',
        now(),
        now()
      );
      
      -- Verify the insertion was successful
      SELECT id INTO v_existing_car_id FROM public.cars WHERE id = v_car_id;
      
      IF v_existing_car_id IS NOT NULL THEN
        v_insert_success := true;
        
        INSERT INTO system_logs (
          log_type, 
          message, 
          details, 
          correlation_id
        ) VALUES (
          'car_listing', 
          'Successfully created new car', 
          jsonb_build_object('car_id', v_car_id),
          v_log_id
        );
      ELSE
        INSERT INTO system_logs (
          log_type, 
          message, 
          error_message,
          correlation_id
        ) VALUES (
          'car_listing_error', 
          'Car insertion appeared successful but car not found in database', 
          'INSERT operation completed but subsequent SELECT returned no results',
          v_log_id
        );
        
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Car creation failed - insertion not verified'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO system_logs (
        log_type, 
        message, 
        error_message,
        details,
        correlation_id
      ) VALUES (
        'car_listing_error', 
        'Error creating new car', 
        SQLERRM,
        jsonb_build_object(
          'error_code', SQLSTATE,
          'car_id', v_car_id
        ),
        v_log_id
      );
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Failed to create car: ' || SQLERRM
      );
    END;
  END IF;

  -- Final verification that we have a valid car ID
  IF v_car_id IS NULL THEN
    INSERT INTO system_logs (
      log_type, 
      message, 
      error_message,
      correlation_id
    ) VALUES (
      'car_listing_error', 
      'Final verification failed: car_id is null', 
      'No car ID available after processing',
      v_log_id
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to generate or retrieve car ID'
    );
  END IF;

  -- Log successful completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    correlation_id
  ) VALUES (
    'car_listing', 
    'Completed car listing security definer function successfully', 
    jsonb_build_object(
      'user_id', p_user_id, 
      'car_id', v_car_id,
      'operation', CASE WHEN v_insert_success THEN 'insert/update' ELSE 'unknown' END
    ),
    v_log_id
  );

  -- Return success with car ID
  RETURN jsonb_build_object(
    'success', true,
    'car_id', v_car_id
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO system_logs (
    log_type, 
    message, 
    details, 
    error_message,
    correlation_id
  ) VALUES (
    'car_listing_error', 
    'Unhandled error in car listing security definer function', 
    jsonb_build_object(
      'user_id', p_user_id,
      'error_code', SQLSTATE
    ),
    SQLERRM,
    v_log_id
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.create_car_listing TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_car_listing TO service_role;

-- Comment on function for clarity
COMMENT ON FUNCTION public.create_car_listing IS 
  'Security definer function to safely create car listings while bypassing RLS - Enhanced with comprehensive error handling and logging';
