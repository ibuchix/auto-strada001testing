
/**
 * Changes made:
 * - 2025-05-15: Extracted API calls from valuationService.ts
 * - 2025-11-05: Integrated with robust API client for automatic retries and error handling
 * - 2025-11-06: Fixed TypeScript response type issues
 * - 2025-11-10: Updated to use consolidated handle-seller-operations function
 * - 2025-12-01: Updated to use dedicated get-vehicle-valuation endpoint
 * - 2025-11-01: Fixed direct function invocation with proper error handling
 * - 2025-04-03: Enhanced debugging with detailed logging and performance metrics
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "../../types";
import { generateRequestId, createPerformanceTracker } from "./utils/debug-utils";

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
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('home_valuation_api', requestId);
  
  console.log(`[HomeValuationAPI][${requestId}] Fetching valuation for:`, { 
    vin, 
    mileage, 
    gearbox,
    timestamp: new Date().toISOString()
  });
  
  try {
    perfTracker.checkpoint('api_call_start');
    
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
    
    perfTracker.checkpoint('api_call_complete');
    
    if (error) {
      console.error(`[HomeValuationAPI][${requestId}] Edge function error:`, {
        message: error.message,
        name: error.name,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', { 
        errorType: 'edge_function_error',
        message: error.message
      });
      
      throw new Error(`API error: ${error.message}`);
    }
    
    // Check if the data is in the expected format
    if (!data) {
      console.error(`[HomeValuationAPI][${requestId}] No data returned from edge function`, {
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', { 
        errorType: 'missing_data',
        message: 'No valuation data returned'
      });
      
      throw new Error('No valuation data returned');
    }
    
    console.log(`[HomeValuationAPI][${requestId}] Received valuation data:`, {
      make: data.make,
      model: data.model,
      year: data.year,
      hasValuation: !!data.valuation,
      hasReservePrice: !!data.reservePrice,
      propertiesCount: Object.keys(data).length,
      timestamp: new Date().toISOString()
    });
    
    // Calculate reserve price if not provided
    if (data && data.valuation && !data.reservePrice) {
      data.reservePrice = calculateReservePrice(data.valuation);
      console.log(`[HomeValuationAPI][${requestId}] Calculated reserve price:`, { 
        reservePrice: data.reservePrice,
        baseValue: data.valuation,
        timestamp: new Date().toISOString()
      });
    }
    
    perfTracker.complete('success', {
      dataReceived: true,
      withCalculation: !!(data && data.valuation && !data.reservePrice),
      processingTimeMs: perfTracker.checkpoint('processing_complete'),
      timestamp: new Date().toISOString()
    });
    
    return { data };
  } catch (error: any) {
    console.error(`[HomeValuationAPI][${requestId}] Error fetching valuation:`, {
      message: error.message,
      stack: error.stack,
      vin,
      mileage,
      timestamp: new Date().toISOString()
    });
    
    perfTracker.complete('error', {
      errorType: error.constructor?.name,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
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
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('seller_valuation_api', requestId);
  
  console.log(`[SellerValuationAPI][${requestId}] Fetching valuation for:`, { 
    vin, 
    mileage, 
    gearbox, 
    userId,
    timestamp: new Date().toISOString()
  });
  
  try {
    perfTracker.checkpoint('api_call_start');
    
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
    
    perfTracker.checkpoint('api_call_complete');
    
    if (error) {
      console.error(`[SellerValuationAPI][${requestId}] Edge function error:`, {
        message: error.message,
        name: error.name,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', { 
        errorType: 'edge_function_error',
        message: error.message
      });
      
      throw new Error(`API error: ${error.message}`);
    }
    
    // Handle specific error format from this endpoint
    if (!response.success) {
      console.error(`[SellerValuationAPI][${requestId}] API response indicates failure:`, {
        error: response.error,
        code: response.errorCode,
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', { 
        errorType: 'api_response_failure',
        message: response.error
      });
      
      throw new Error(response.error || 'Failed to validate vehicle');
    }
    
    console.log(`[SellerValuationAPI][${requestId}] Received seller valuation data:`, {
      make: response.data?.make,
      model: response.data?.model,
      year: response.data?.year,
      hasValuation: !!response.data?.valuation,
      hasReservePrice: !!response.data?.reservePrice,
      propertiesCount: response.data ? Object.keys(response.data).length : 0,
      timestamp: new Date().toISOString()
    });
    
    // Calculate reserve price if not provided
    if (response.data && response.data.valuation && !response.data.reservePrice) {
      response.data.reservePrice = calculateReservePrice(response.data.valuation);
      console.log(`[SellerValuationAPI][${requestId}] Calculated reserve price:`, {
        reservePrice: response.data.reservePrice,
        baseValue: response.data.valuation,
        timestamp: new Date().toISOString()
      });
    }
    
    perfTracker.complete('success', { 
      dataReceived: true,
      withCalculation: !!(response.data && response.data.valuation && !response.data.reservePrice),
      processingTimeMs: perfTracker.checkpoint('processing_complete'),
      timestamp: new Date().toISOString()
    });
    
    return { data: response.data };
  } catch (error: any) {
    console.error(`[SellerValuationAPI][${requestId}] Error fetching seller valuation:`, {
      message: error.message,
      stack: error.stack,
      vin,
      mileage,
      userId,
      timestamp: new Date().toISOString()
    });
    
    perfTracker.complete('error', {
      errorType: error.constructor?.name,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
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
