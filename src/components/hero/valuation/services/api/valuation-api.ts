
/**
 * Changes made:
 * - 2025-05-15: Extracted API calls from valuationService.ts
 * - 2025-11-05: Integrated with robust API client for automatic retries and error handling
 * - 2025-11-06: Fixed TypeScript response type issues
 */

import { apiClient } from "@/services/api/apiClientService";
import { supabase } from "@/integrations/supabase/client";

// Define response type for better type safety
interface ValuationResponse {
  data?: {
    make?: string;
    model?: string;
    year?: number;
    valuation?: number;
    averagePrice?: number;
    reservePrice?: number;
    isExisting?: boolean;
    reservationId?: string;
    [key: string]: any;
  };
  error?: Error;
}

/**
 * Fetch valuation data for home page context
 */
export async function fetchHomeValuation(
  vin: string,
  mileage: number,
  gearbox: string
): Promise<ValuationResponse> {
  console.log('Fetching home valuation from API for:', { vin, mileage, gearbox });
  
  const response = await apiClient.invokeFunction('get-vehicle-valuation', {
    vin, mileage, gearbox, context: 'home'
  }, {
    retries: 2,
    timeout: 15000,
    errorMessage: 'Failed to get vehicle valuation'
  });
  
  return response as ValuationResponse;
}

/**
 * Fetch valuation data for seller context with user authentication
 */
export async function fetchSellerValuation(
  vin: string,
  mileage: number,
  gearbox: string,
  userId: string
): Promise<ValuationResponse> {
  console.log('Fetching seller valuation from API for:', { vin, mileage, gearbox, userId });
  
  const response = await apiClient.invokeFunction('handle-seller-operations', {
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
  
  return response as ValuationResponse;
}
