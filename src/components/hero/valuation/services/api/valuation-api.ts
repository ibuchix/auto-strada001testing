
/**
 * Enhanced valuation API with improved error handling and data extraction
 * 
 * Changes:
 * - 2025-04-17: Improved data normalization and error handling
 * - 2025-04-17: Enhanced debug logging for better troubleshooting
 * - 2025-04-17: Added robust fallback mechanisms for inconsistent API responses
 * - 2025-04-17: Updated to use standardized data models and types
 * - 2025-04-21: Fixed TypeScript errors with imports and type definitions
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType, ValuationData } from "@/utils/valuation/valuationDataTypes";
import { normalizeValuationData } from "@/utils/valuation/valuationDataNormalizer";
import { generateRequestId, createPerformanceTracker } from "./utils/debug-utils";

// Import the ValuationResult type from the correct location
import { ValuationResult } from "@/hooks/valuation/types/valuationTypes";

/**
 * Fetch valuation data for home page context
 */
export async function fetchHomeValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
): Promise<{ data?: ValuationData; error?: Error }> {
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('home_valuation_api', requestId);
  
  console.group(`[HomeValuationAPI][${requestId}][Detailed Valuation Check]`);
  console.log('Request Parameters:', { 
    vin, 
    mileage, 
    gearbox,
    timestamp: new Date().toISOString(),
    requestId
  });
  
  try {
    perfTracker.checkpoint('api_call_start');
    
    const { data, error } = await supabase.functions.invoke<any>(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox 
        }
      }
    );
    
    perfTracker.checkpoint('api_call_complete');
    
    console.log('Raw API Response:', { 
      hasData: !!data, 
      hasError: !!error,
      dataKeys: data ? Object.keys(data) : null,
      dataSize: data ? JSON.stringify(data).length : 0
    });
    
    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    if (!data) {
      console.warn('No data returned from edge function');
      throw new Error('No valuation data returned');
    }
    
    // Log full API response for debugging (truncated for readability)
    console.log('API Response Excerpt:', JSON.stringify(data).substring(0, 300) + '...');
    
    // Use our standardized normalizer
    const normalizedData = normalizeValuationData({
      ...data,
      vin,
      mileage,
      transmission: gearbox
    });
    
    console.log('Processed Valuation Data:', {
      make: normalizedData.make,
      model: normalizedData.model,
      year: normalizedData.year,
      valuation: normalizedData.valuation,
      reservePrice: normalizedData.reservePrice,
      averagePrice: normalizedData.averagePrice,
      hasValidMake: !!normalizedData.make,
      hasValidModel: !!normalizedData.model,
      hasValidYear: !!normalizedData.year
    });
    
    console.groupEnd();
    
    return { data: normalizedData };
  } catch (error: any) {
    console.error(`Valuation API Error:`, {
      message: error.message,
      stack: error.stack
    });
    console.groupEnd();
    
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
): Promise<{ data?: ValuationData; error?: Error }> {
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
    
    // Log full response for debugging
    console.log(`[SellerValuationAPI][${requestId}] Raw API Response:`, {
      hasResponse: !!response,
      responseSize: response ? JSON.stringify(response).length : 0,
      responseKeys: response ? Object.keys(response) : [],
      hasError: !!error,
    });
    
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
    if (!response || !response.success) {
      console.error(`[SellerValuationAPI][${requestId}] API response indicates failure:`, {
        error: response?.error || 'No success response received',
        code: response?.errorCode,
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : [],
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', {
        errorType: 'api_response_failure',
        message: response?.error || 'Failed to validate vehicle'
      });
      
      throw new Error(response?.error || 'Failed to validate vehicle');
    }

    // Use our standardized normalizer
    const normalizedData = normalizeValuationData({
      ...response.data,
      vin,
      mileage,
      transmission: gearbox
    });
    
    console.log(`[SellerValuationAPI][${requestId}] Normalized vehicle data:`, {
      make: normalizedData.make,
      model: normalizedData.model,
      year: normalizedData.year,
      valuation: normalizedData.valuation,
      reservePrice: normalizedData.reservePrice,
      isComplete: !!(normalizedData.make && normalizedData.model && normalizedData.year)
    });
    
    perfTracker.complete('success', { 
      dataReceived: true,
      hasVehicleDetails: !!(normalizedData.make && normalizedData.model),
      processingTimeMs: perfTracker.checkpoint('processing_complete'),
      timestamp: new Date().toISOString()
    });
    
    return { data: normalizedData };
  } catch (error: any) {
    console.error(`[SellerValuationAPI][${requestId}] Error fetching seller valuation:`, {
      message: error.message,
      stack: error.stack,
      vin,
      mileage,
      userId,
      timestamp: new Date().toISOString()
    });
    
    perfTracker.complete('failure', {
      errorType: error.constructor?.name,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    return { error: error instanceof Error ? error : new Error(error.message || 'Unknown error') };
  }
}

/**
 * Calculate the reserve price based on base price
 * Uses the official pricing tiers and percentages
 */
export function calculateReservePrice(basePrice: number): number {
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}
