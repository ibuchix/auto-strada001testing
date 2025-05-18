
-- Create a security definer function to safely get seller performance metrics
CREATE OR REPLACE FUNCTION public.get_seller_performance_metrics(p_seller_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics jsonb;
BEGIN
  -- Get the performance metrics for the specific seller
  SELECT to_jsonb(spm)
  INTO v_metrics
  FROM seller_performance_metrics spm
  WHERE seller_id = p_seller_id;
  
  -- If no metrics are found, return an empty object
  IF v_metrics IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Return the metrics data
  RETURN v_metrics;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_seller_performance_metrics(uuid) IS 'Get performance metrics for a seller safely bypassing RLS';

-- Create an RPC wrapper for easier fetch from client code
CREATE OR REPLACE FUNCTION public.fetch_seller_performance(p_seller_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid := COALESCE(p_seller_id, auth.uid());
BEGIN
  RETURN public.get_seller_performance_metrics(v_seller_id);
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.fetch_seller_performance(uuid) IS 'Fetch performance metrics for a seller with optional ID parameter';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.fetch_seller_performance(uuid) TO authenticated;
