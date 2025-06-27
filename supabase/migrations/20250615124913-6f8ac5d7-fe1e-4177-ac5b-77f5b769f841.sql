
-- Migration: Add auction_scheduled field to cars table for improved seller status visibility

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS auction_scheduled boolean NOT NULL DEFAULT false;

-- (Optional) Index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_cars_auction_scheduled ON public.cars(auction_scheduled);

-- Update existing cars: mark as scheduled if auction_status is present (excluding null/empty)
UPDATE public.cars
SET auction_scheduled = true
WHERE auction_status IS NOT NULL
  AND auction_status <> '';
