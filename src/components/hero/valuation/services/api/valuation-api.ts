
/**
 * Changes made:
 * - 2025-05-15: Extracted API calls from valuationService.ts
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch valuation data for home page context
 */
export async function fetchHomeValuation(
  vin: string,
  mileage: number,
  gearbox: string
) {
  console.log('Fetching home valuation from API for:', { vin, mileage, gearbox });
  
  return await supabase.functions.invoke('get-vehicle-valuation', {
    body: { vin, mileage, gearbox, context: 'home' },
  });
}

/**
 * Fetch valuation data for seller context with user authentication
 */
export async function fetchSellerValuation(
  vin: string,
  mileage: number,
  gearbox: string,
  userId: string
) {
  console.log('Fetching seller valuation from API for:', { vin, mileage, gearbox, userId });
  
  return await supabase.functions.invoke('handle-seller-operations', {
    body: {
      operation: 'validate_vin',
      vin,
      mileage,
      gearbox,
      userId
    }
  });
}
