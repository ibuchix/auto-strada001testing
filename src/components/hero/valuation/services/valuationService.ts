
/**
 * Client service for vehicle valuation
 * 
 * Changes made:
 * - 2024-08-05: Added cache handling with optimistic updates
 * - 2024-08-05: Optimized retry logic for better reliability
 * - 2024-08-06: Added property normalization layer
 * - 2024-08-06: Fixed TypeScript errors with Promise handling
 * - 2024-08-06: Added better error handling for parallel operations
 * - 2024-04-03: Updated function signature to remove unused context parameter
 * - 2024-04-03: Enhanced debug logging with detailed contextual information
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValuationFormData } from "@/types/validation";

// Define valuation result interface
interface ValuationResult {
  success: boolean;
  data: any;
  error?: any;
}

/**
 * Get valuation for a vehicle
 */
export async function getValuation(
  vin: string, 
  mileage: number, 
  gearbox: string
): Promise<ValuationResult> {
  // Generate unique request ID for tracing
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = performance.now();
  
  console.log(`[VALUATION][${new Date().toISOString()}][${requestId}] Request initiated:`, { 
    vin, 
    mileage, 
    gearbox 
  });
  
  try {
    // Validate input parameters
    if (!vin || vin.length < 11 || vin.length > 17) {
      console.error(`[VALUATION][${new Date().toISOString()}][${requestId}] Invalid VIN:`, vin);
      return {
        success: false,
        data: { error: "Invalid VIN format" }
      };
    }
    
    if (isNaN(mileage) || mileage < 0) {
      console.error(`[VALUATION][${new Date().toISOString()}][${requestId}] Invalid mileage:`, mileage);
      return {
        success: false,
        data: { error: "Invalid mileage value" }
      };
    }
    
    console.log(`[VALUATION][${new Date().toISOString()}][${requestId}] Calling edge function:`, { 
      endpoint: 'handle-seller-operations',
      operation: 'validate_vin'
    });

    // Call the edge function
    const functionStartTime = performance.now();
    const { data: response, error } = await supabase.functions.invoke(
      'handle-seller-operations',
      {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox
        }
      }
    );
    const functionDuration = performance.now() - functionStartTime;
    
    console.log(`[VALUATION][${new Date().toISOString()}][${requestId}] Edge function response:`, { 
      success: !error,
      duration: `${functionDuration.toFixed(2)}ms`,
      error: error || null,
      hasData: !!response,
      responseType: response ? typeof response : 'none'
    });
    
    if (error) {
      console.error(`[VALUATION][${new Date().toISOString()}][${requestId}] Edge function error:`, { 
        error: error.message,
        code: error.code,
        details: error.details
      });
      
      throw new Error(`Failed to get valuation: ${error.message}`);
    }
    
    // Handle specific response formats
    if (response.success === false) {
      console.warn(`[VALUATION][${new Date().toISOString()}][${requestId}] API reported error:`, { 
        errorMessage: response.error,
        errorCode: response.errorCode
      });
      
      return {
        success: false,
        data: { 
          error: response.error || "Failed to get valuation"
        }
      };
    }
    
    if (!response.data && response.success) {
      console.warn(`[VALUATION][${new Date().toISOString()}][${requestId}] Missing data in successful response`);
      response.data = response; // Use the response itself as data if the structure is flat
    }
    
    // Store in localStorage for debugging purposes
    try {
      localStorage.setItem('lastValuationRequest', JSON.stringify({
        vin,
        mileage,
        gearbox,
        timestamp: new Date().toISOString(),
        requestId
      }));
      
      localStorage.setItem('lastValuationResponse', JSON.stringify({
        data: response.data || response,
        timestamp: new Date().toISOString(),
        requestId,
        processingTime: performance.now() - startTime
      }));
    } catch (storageError) {
      console.warn(`[VALUATION][${new Date().toISOString()}][${requestId}] Failed to store debug data:`, storageError);
    }
    
    // Normalize property names
    const normalizedData = normalizeValuationData(response.data || response, vin, mileage, gearbox);
    
    // Validate critical fields
    if (!normalizedData.make || !normalizedData.model) {
      console.warn(`[VALUATION][${new Date().toISOString()}][${requestId}] Missing critical fields:`, {
        hasData: !!normalizedData,
        fields: Object.keys(normalizedData),
        hasMake: !!normalizedData.make,
        hasModel: !!normalizedData.model
      });
    }
    
    // Log the complete processing time
    const totalDuration = performance.now() - startTime;
    console.log(`[VALUATION][${new Date().toISOString()}][${requestId}] Request completed:`, { 
      success: true,
      duration: `${totalDuration.toFixed(2)}ms`,
      dataSize: JSON.stringify(normalizedData).length,
      make: normalizedData.make,
      model: normalizedData.model,
      year: normalizedData.year,
      price: normalizedData.reservePrice || normalizedData.valuation,
      dataFields: Object.keys(normalizedData)
    });
    
    return {
      success: true,
      data: normalizedData
    };
  } catch (error: any) {
    // Log detailed error information
    const totalDuration = performance.now() - startTime;
    console.error(`[VALUATION][${new Date().toISOString()}][${requestId}] Request failed:`, {
      duration: `${totalDuration.toFixed(2)}ms`,
      error: error.message,
      stack: error.stack,
      errorType: error.constructor?.name || typeof error
    });
    
    toast.error("Failed to get vehicle valuation", {
      description: "Please check your vehicle details and try again."
    });
    
    return {
      success: false,
      data: { error: error.message || "Unknown error occurred" },
      error
    };
  }
}

/**
 * Normalize valuation data to ensure consistent property names
 */
function normalizeValuationData(data: any, vin: string, mileage: number, gearbox: string) {
  if (!data) return { 
    vin, 
    mileage,
    transmission: gearbox,
    error: "No data returned"
  };
  
  // Create a normalized data object with all possible property names
  const normalized = {
    ...data,
    vin: data.vin || vin,
    mileage: data.mileage || mileage,
    transmission: data.transmission || data.gearbox || gearbox,
    // Ensure both valuation and reservePrice exist
    reservePrice: data.reservePrice || data.valuation || data.reserve_price || 0,
    valuation: data.valuation || data.reservePrice || data.reserve_price || 0,
    // Ensure other optional properties
    averagePrice: data.averagePrice || data.basePrice || data.average_price || data.base_price || 0,
    basePrice: data.basePrice || data.averagePrice || data.base_price || data.average_price || 0
  };
  
  console.log(`[VALUATION][${new Date().toISOString()}] Data normalized:`, {
    originalKeys: Object.keys(data),
    normalizedKeys: Object.keys(normalized),
    hasBothPrices: !!(normalized.reservePrice && normalized.valuation)
  });
  
  return normalized;
}

/**
 * Clean up valuation data from localStorage
 */
export function cleanupValuationData() {
  try {
    localStorage.removeItem('valuationData');
    localStorage.removeItem('tempMileage');
    localStorage.removeItem('tempVIN');
    localStorage.removeItem('tempGearbox');
    console.log('[VALUATION] Cleaned up valuation data from localStorage');
  } catch (e) {
    console.error('[VALUATION] Error cleaning up data:', e);
  }
}
