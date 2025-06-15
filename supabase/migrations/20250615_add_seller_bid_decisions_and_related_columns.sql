
-- Implements seller bid accept/decline foundation
-- 2025-06-15: Create seller_bid_decisions table and dashboard tracking columns

CREATE TABLE public.seller_bid_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  auction_result_id UUID REFERENCES auction_results(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES sellers(user_id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('accepted', 'declined')),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  highest_bid NUMERIC,
  highest_bid_dealer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auction_results
  ADD COLUMN IF NOT EXISTS seller_decision TEXT CHECK (seller_decision IN ('accepted', 'declined')),
  ADD COLUMN IF NOT EXISTS admin_review_status TEXT CHECK (admin_review_status IN ('pending', 'reviewed')) DEFAULT 'pending';

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS awaiting_seller_decision BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cars_awaiting_seller_decision ON public.cars(awaiting_seller_decision);

ALTER TABLE public.seller_bid_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Sellers can insert their own bid decisions"
  ON public.seller_bid_decisions
  FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Sellers can view their own bid decisions"
  ON public.seller_bid_decisions
  FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Sellers can update their own bid decisions"
  ON public.seller_bid_decisions
  FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Sellers can delete their own bid decisions"
  ON public.seller_bid_decisions
  FOR DELETE
  USING (seller_id = auth.uid());
