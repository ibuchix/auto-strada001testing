
-- Migration: Add fuel_type column to cars table for seller form update (2025-06-15)

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS fuel_type TEXT;

-- Optional: Add to index if you plan to filter a lot by fuel type
-- CREATE INDEX IF NOT EXISTS idx_cars_fuel_type ON public.cars(fuel_type);
