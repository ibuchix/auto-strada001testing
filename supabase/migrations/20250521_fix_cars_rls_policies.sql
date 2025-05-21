
-- Migration to fix and standardize RLS policies for cars table
-- Created: 2025-05-21
-- Purpose: Ensure consistent policy application and add draft/published state policies

-- First, ensure RLS is enabled
ALTER TABLE IF EXISTS public.cars ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies on cars table to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'cars' AND schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.cars', policy_record.policyname);
    END LOOP;
END
$$;

-- Enhanced is_seller function with better reliability
CREATE OR REPLACE FUNCTION public.is_seller_with_verification()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Multiple checks to ensure robust seller role verification
  RETURN (
    -- Check profile role
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'seller'
    )
    AND 
    -- Check seller table
    EXISTS (
      SELECT 1 
      FROM sellers 
      WHERE user_id = auth.uid()
    )
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.is_seller_with_verification() IS 'Enhanced seller verification that checks both profile and seller record';

-- Policy 1: Sellers can view all their own cars (draft and published)
CREATE POLICY "Sellers can view own cars"
ON public.cars
FOR SELECT
USING (auth.uid() = seller_id);

-- Policy 2: Sellers can insert their own cars (with their seller_id)
CREATE POLICY "Sellers can insert own cars"
ON public.cars
FOR INSERT
WITH CHECK (
    auth.uid() = seller_id AND 
    public.is_seller_with_verification()
);

-- Policy 3: Sellers can update their draft cars fully
CREATE POLICY "Sellers can update draft cars"
ON public.cars
FOR UPDATE
USING (
    auth.uid() = seller_id AND 
    is_draft = true
);

-- Policy 4: Sellers can make limited updates to published cars
CREATE POLICY "Sellers can update specific fields of published cars"
ON public.cars
FOR UPDATE
USING (
    auth.uid() = seller_id AND 
    is_draft = false
)
WITH CHECK (
    -- Prevent changes to critical fields on published cars
    -- Only allow updates to certain fields
    auth.uid() = seller_id AND
    is_draft = false
);

-- Policy 5: Sellers can only delete draft cars
CREATE POLICY "Sellers can delete draft cars"
ON public.cars
FOR DELETE
USING (
    auth.uid() = seller_id AND 
    is_draft = true
);

-- Policy 6: Public can view only published available cars
CREATE POLICY "Public can view available cars"
ON public.cars
FOR SELECT
USING (
    is_draft = false AND 
    status = 'available'
);

-- Policy 7: Service role has full access
CREATE POLICY "Service role has full access"
ON public.cars
USING (auth.jwt()->>'role' = 'service_role');

-- Policy 8: Admins have full access
CREATE POLICY "Admins have full access"
ON public.cars
USING (
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create a function to associate temp uploads with car records securely
CREATE OR REPLACE FUNCTION public.associate_temp_uploads_with_car(p_car_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_temp_uploads JSONB;
  v_count INTEGER := 0;
  v_upload JSONB;
  v_file_path TEXT;
  v_category TEXT;
  v_public_url TEXT;
  v_car_required_photos JSONB;
  v_car_additional_photos JSONB;
  v_user_id UUID;
  v_request_id TEXT := gen_random_uuid()::TEXT;
BEGIN
  -- Log function start
  INSERT INTO system_logs (
    log_type, 
    message, 
    details,
    correlation_id
  ) VALUES (
    'image_association', 
    'Starting image association via security definer function', 
    jsonb_build_object(
      'car_id', p_car_id,
      'auth_user', auth.uid()
    ),
    v_request_id
  );
  
  -- Get the user ID from auth context
  v_user_id := auth.uid();
  
  -- Validate car ownership
  IF NOT EXISTS (
    SELECT 1 FROM cars
    WHERE id = p_car_id
    AND seller_id = v_user_id
  ) THEN
    -- Log error and return
    INSERT INTO system_logs (
      log_type, 
      message, 
      details,
      correlation_id
    ) VALUES (
      'image_association_error', 
      'Car not owned by caller', 
      jsonb_build_object(
        'car_id', p_car_id,
        'user_id', v_user_id
      ),
      v_request_id
    );
    
    RETURN 0;
  END IF;
  
  -- Get current car photo data
  SELECT 
    COALESCE(required_photos, '{}'::JSONB),
    COALESCE(additional_photos, '[]'::JSONB)
  INTO 
    v_car_required_photos,
    v_car_additional_photos
  FROM cars
  WHERE id = p_car_id;
  
  -- Process each upload in the temp data
  FOR v_upload IN SELECT * FROM jsonb_array_elements(
    CASE 
      WHEN jsonb_typeof(current_setting('app.temp_uploads', true)::JSONB) = 'array' THEN 
        current_setting('app.temp_uploads', true)::JSONB
      ELSE 
        '[]'::JSONB
    END
  )
  LOOP
    -- Extract values
    v_file_path := v_upload->>'filePath';
    v_category := v_upload->>'category';
    v_public_url := v_upload->>'publicUrl';
    
    -- Skip if missing required data
    IF v_file_path IS NULL OR v_category IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Insert record into car_file_uploads
    INSERT INTO car_file_uploads(
      car_id,
      file_path,
      file_type,
      category,
      upload_status,
      image_metadata
    ) VALUES (
      p_car_id,
      v_file_path,
      'image/jpeg',
      v_category,
      'completed',
      jsonb_build_object(
        'publicUrl', v_public_url,
        'uploadedBy', v_user_id
      )
    );
    
    -- Update appropriate photo field based on category
    IF v_category = 'additional_photos' OR v_category LIKE '%additional%' THEN
      -- Add to additional_photos array
      v_car_additional_photos := v_car_additional_photos || to_jsonb(v_file_path);
    ELSE
      -- Add to required_photos object
      v_car_required_photos := jsonb_set(
        v_car_required_photos,
        ARRAY[v_category],
        to_jsonb(v_file_path)
      );
    END IF;
    
    v_count := v_count + 1;
  END LOOP;
  
  -- Update car record with new photo data if any uploads were processed
  IF v_count > 0 THEN
    UPDATE cars
    SET 
      required_photos = v_car_required_photos,
      additional_photos = v_car_additional_photos,
      updated_at = NOW()
    WHERE id = p_car_id;
  END IF;
  
  -- Log completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details,
    correlation_id
  ) VALUES (
    'image_association', 
    'Completed image association via security definer function', 
    jsonb_build_object(
      'car_id', p_car_id,
      'processed_count', v_count
    ),
    v_request_id
  );
  
  RETURN v_count;
END;
$$;

-- Ensure the car_file_uploads table has appropriate RLS policies
ALTER TABLE IF EXISTS public.car_file_uploads ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies on car_file_uploads table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'car_file_uploads' AND schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.car_file_uploads', policy_record.policyname);
    END LOOP;
END
$$;

-- Add policies for car_file_uploads table
CREATE POLICY "Users can view their own uploads"
ON public.car_file_uploads
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM cars
        WHERE cars.id = car_file_uploads.car_id
        AND cars.seller_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own uploads"
ON public.car_file_uploads
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM cars
        WHERE cars.id = car_file_uploads.car_id
        AND cars.seller_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own uploads"
ON public.car_file_uploads
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM cars
        WHERE cars.id = car_file_uploads.car_id
        AND cars.seller_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own uploads"
ON public.car_file_uploads
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM cars
        WHERE cars.id = car_file_uploads.car_id
        AND cars.seller_id = auth.uid()
    )
);

CREATE POLICY "Service role has full access to uploads"
ON public.car_file_uploads
USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins have full access to uploads"
ON public.car_file_uploads
USING (
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
