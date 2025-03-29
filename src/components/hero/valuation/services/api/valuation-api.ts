
/**
 * Changes made:
 * - 2025-05-15: Extracted API calls from valuationService.ts
 * - 2025-11-05: Integrated with robust API client for automatic retries and error handling
 */

import { apiClient } from "@/services/api/apiClientService";
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
  
  return await apiClient.invokeFunction('get-vehicle-valuation', {
    vin, mileage, gearbox, context: 'home'
  }, {
    retries: 2,
    timeout: 15000,
    errorMessage: 'Failed to get vehicle valuation'
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
  
  return await apiClient.invokeFunction('handle-seller-operations', {
    operation: 'validate_vin',
    vin,
    mileage,
    gearbox,
    userId
  }, {
    retries: 2,
    timeout: 20000,
    errorMessage: 'Failed to validate vehicle'
  });
}
