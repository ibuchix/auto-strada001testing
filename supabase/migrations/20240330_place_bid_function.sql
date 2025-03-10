
-- Function to place a bid with proper conflict resolution
CREATE OR REPLACE FUNCTION public.place_bid(
  p_car_id UUID,
  p_dealer_id UUID,
  p_amount NUMERIC,
  p_is_proxy BOOLEAN DEFAULT FALSE,
  p_max_proxy_amount NUMERIC DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_car RECORD;
  v_current_high_bid NUMERIC;
  v_min_bid NUMERIC;
  v_bid_id UUID;
  v_outbid_status TEXT;
BEGIN
  -- Lock the car row to prevent concurrent modifications
  SELECT * INTO v_car
  FROM cars
  WHERE id = p_car_id
  FOR UPDATE;
  
  -- Check if car exists
  IF v_car.id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Car not found'
    );
  END IF;
  
  -- Check if auction is active
  IF v_car.auction_status != 'active' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'This auction is not currently active'
    );
  END IF;
  
  -- Determine current high bid and minimum required bid
  v_current_high_bid := COALESCE(v_car.current_bid, 0);
  v_min_bid := GREATEST(v_car.price, v_current_high_bid + COALESCE(v_car.minimum_bid_increment, 100));
  
  -- Check if bid is high enough
  IF p_amount < v_min_bid THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Bid amount is too low',
      'minimum_bid', v_min_bid
    );
  END IF;
  
  -- If this is a proxy bid, store it
  IF p_is_proxy AND p_max_proxy_amount IS NOT NULL AND p_max_proxy_amount >= p_amount THEN
    -- Check if dealer already has a proxy bid for this car
    PERFORM 1 FROM proxy_bids 
    WHERE car_id = p_car_id AND dealer_id = p_dealer_id;
    
    IF FOUND THEN
      -- Update existing proxy bid
      UPDATE proxy_bids
      SET max_bid_amount = p_max_proxy_amount,
          updated_at = now()
      WHERE car_id = p_car_id AND dealer_id = p_dealer_id;
    ELSE
      -- Create new proxy bid
      INSERT INTO proxy_bids (
        car_id,
        dealer_id,
        max_bid_amount
      ) VALUES (
        p_car_id,
        p_dealer_id,
        p_max_proxy_amount
      );
    END IF;
  END IF;
  
  -- Find previous high bid to update its status
  IF v_current_high_bid > 0 THEN
    UPDATE bids
    SET status = 'outbid'
    WHERE car_id = p_car_id
      AND status = 'active'
      AND amount = v_current_high_bid;
  END IF;
  
  -- Insert the new bid
  INSERT INTO bids (
    car_id,
    dealer_id,
    amount,
    status
  ) VALUES (
    p_car_id,
    p_dealer_id,
    p_amount,
    'active'
  )
  RETURNING id INTO v_bid_id;
  
  -- Update car's current bid
  UPDATE cars
  SET current_bid = p_amount,
      updated_at = now()
  WHERE id = p_car_id;
  
  -- Return success
  RETURN json_build_object(
    'success', TRUE,
    'bid_id', v_bid_id,
    'amount', p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;
