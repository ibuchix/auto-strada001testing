
-- This migration adds Row Level Security policies to the cars table
-- to ensure sellers can access their own car listings

-- First enable RLS on the cars table if not already enabled
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to safely check if a user is a seller
CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'seller'
  );
END;
$$;

-- Create policy for sellers to view their own listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'cars' AND policyname = 'Sellers can view own listings'
  ) THEN
    CREATE POLICY "Sellers can view own listings" 
    ON public.cars 
    FOR SELECT 
    USING (auth.uid() = seller_id);
  END IF;
END
$$;

-- Create policy for sellers to insert their own listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'cars' AND policyname = 'Sellers can insert own listings'
  ) THEN
    CREATE POLICY "Sellers can insert own listings" 
    ON public.cars 
    FOR INSERT 
    WITH CHECK (auth.uid() = seller_id);
  END IF;
END
$$;

-- Create policy for sellers to update their own listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'cars' AND policyname = 'Sellers can update own listings'
  ) THEN
    CREATE POLICY "Sellers can update own listings" 
    ON public.cars 
    FOR UPDATE 
    USING (auth.uid() = seller_id);
  END IF;
END
$$;

-- Create policy for sellers to delete their own listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'cars' AND policyname = 'Sellers can delete own listings'
  ) THEN
    CREATE POLICY "Sellers can delete own listings" 
    ON public.cars 
    FOR DELETE 
    USING (auth.uid() = seller_id);
  END IF;
END
$$;

-- Create a secure function for fetching seller listings
CREATE OR REPLACE FUNCTION public.get_seller_listings(p_seller_id uuid)
RETURNS SETOF public.cars
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.cars
  WHERE seller_id = p_seller_id;
END;
$$;

-- Also create a policy for sellers to view seller_performance_metrics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'seller_performance_metrics' AND policyname = 'Sellers can view own metrics'
  ) THEN
    ALTER TABLE IF EXISTS public.seller_performance_metrics ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Sellers can view own metrics" 
    ON public.seller_performance_metrics 
    FOR SELECT 
    USING (auth.uid() = seller_id);
  END IF;
END
$$;
