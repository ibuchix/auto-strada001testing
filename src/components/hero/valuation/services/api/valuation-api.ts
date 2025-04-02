
/**
 * Changes made:
 * - 2025-05-15: Extracted API calls from valuationService.ts
 * - 2025-11-05: Integrated with robust API client for automatic retries and error handling
 * - 2025-11-06: Fixed TypeScript response type issues
 * - 2025-11-10: Updated to use consolidated handle-seller-operations function
 * - 2025-12-01: Updated to use dedicated get-vehicle-valuation endpoint
 * - 2025-11-01: Fixed direct function invocation with proper error handling
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "../../types";

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
  gearbox: TransmissionType
): Promise<ValuationResponse> {
  console.log('Fetching home valuation from API for:', { vin, mileage, gearbox });
  
  try {
    // Use the direct edge function
    const { data, error } = await supabase.functions.invoke<any>(
      'handle-car-listing',
      {
        body: { 
          vin, 
          mileage, 
          gearbox 
        }
      }
    );
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    // Check if the data is in the expected format
    if (!data) {
      console.error('No data returned from edge function');
      throw new Error('No valuation data returned');
    }
    
    console.log('Received valuation data:', data);
    
    // Calculate reserve price if not provided
    if (data && data.valuation && !data.reservePrice) {
      data.reservePrice = calculateReservePrice(data.valuation);
      console.log('Calculated reserve price:', data.reservePrice);
    }
    
    return { data };
  } catch (error: any) {
    console.error('Error fetching valuation:', error);
    return { error: error instanceof Error ? error : new Error(error.message || 'Unknown error') };
  }
}

/**
 * Fetch valuation data for seller context with user authentication
 */
export async function fetchSellerValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType,
  userId: string
): Promise<ValuationResponse> {
  console.log('Fetching seller valuation from API for:', { vin, mileage, gearbox, userId });
  
  try {
    // Use the handle-seller-operations edge function
    const { data: response, error } = await supabase.functions.invoke<any>(
      'handle-seller-operations',
      {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId
        }
      }
    );
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    // Handle specific error format from this endpoint
    if (!response.success) {
      console.error('API response indicates failure:', response.error);
      throw new Error(response.error || 'Failed to validate vehicle');
    }
    
    console.log('Received seller valuation data:', response.data);
    
    // Calculate reserve price if not provided
    if (response.data && response.data.valuation && !response.data.reservePrice) {
      response.data.reservePrice = calculateReservePrice(response.data.valuation);
    }
    
    return { data: response.data };
  } catch (error: any) {
    console.error('Error fetching seller valuation:', error);
    return { error: error instanceof Error ? error : new Error(error.message || 'Unknown error') };
  }
}

/**
 * Calculate reserve price based on valuation using the specified formula
 */
function calculateReservePrice(valuation: number): number {
  // Price tiers and corresponding percentages
  const tiers = [
    { max: 15000, percentage: 0.65 },
    { max: 20000, percentage: 0.46 },
    { max: 30000, percentage: 0.37 },
    { max: 50000, percentage: 0.27 },
    { max: 60000, percentage: 0.27 },
    { max: 70000, percentage: 0.22 },
    { max: 80000, percentage: 0.23 },
    { max: 100000, percentage: 0.24 },
    { max: 130000, percentage: 0.20 },
    { max: 160000, percentage: 0.185 },
    { max: 200000, percentage: 0.22 },
    { max: 250000, percentage: 0.17 },
    { max: 300000, percentage: 0.18 },
    { max: 400000, percentage: 0.18 },
    { max: 500000, percentage: 0.16 },
    { max: Infinity, percentage: 0.145 }
  ];
  
  // Find the correct tier
  const tier = tiers.find(t => valuation <= t.max);
  const percentage = tier ? tier.percentage : 0.145; // Default to lowest percentage
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = valuation - (valuation * percentage);
  
  return Math.round(reservePrice); // Round to nearest whole number
}
