
/**
 * Changes made:
 * - 2024-04-03: Enhanced debug logging with detailed information at each step
 * - 2024-04-03: Added performance tracking with timestamps
 * - 2024-04-03: Improved error handling with more contextual information
 * - 2024-04-03: Standardized parameter logging including VIN and mileage
 */

import { supabase } from "@/integrations/supabase/client";
import { fetchHomeValuation, fetchSellerValuation } from "./api/valuation-api";
import { generateRequestId, logDetailedError, createPerformanceTracker, logApiCall } from "./api/utils/debug-utils";
import { TransmissionType } from "../types";

/**
 * Get valuation for a vehicle 
 * @param vin - Vehicle Identification Number
 * @param mileage - Vehicle mileage
 * @param gearbox - Transmission type
 */
export async function getValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
) {
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('valuation_service', requestId);
  
  try {
    console.log(`[ValuationService][${requestId}] Getting valuation for vehicle:`, { 
      vin, 
      mileage, 
      gearbox,
      timestamp: new Date().toISOString()
    });
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData?.session?.user;
    
    perfTracker.checkpoint('auth_check');
    
    console.log(`[ValuationService][${requestId}] Authentication status:`, { 
      isAuthenticated, 
      userId: sessionData?.session?.user?.id || null,
      timestamp: new Date().toISOString()
    });
    
    // Use different API calls based on authentication status
    let result;
    if (isAuthenticated && sessionData.session?.user?.id) {
      console.log(`[ValuationService][${requestId}] Using authenticated endpoint`);
      result = await fetchSellerValuation(vin, mileage, gearbox, sessionData.session.user.id);
    } else {
      console.log(`[ValuationService][${requestId}] Using public endpoint`);
      result = await fetchHomeValuation(vin, mileage, gearbox);
    }
    
    perfTracker.checkpoint('api_response');
    
    // Handle API response
    if (result.error) {
      console.error(`[ValuationService][${requestId}] API error:`, { 
        error: result.error.message,
        stack: result.error.stack,
        timestamp: new Date().toISOString()
      });
      
      return { 
        success: false, 
        error: result.error.message,
        data: { error: result.error.message } 
      };
    }
    
    // Add detailed logging for data structure
    const responseData = result.data || {};
    console.log(`[ValuationService][${requestId}] Valuation data received:`, { 
      make: responseData.make,
      model: responseData.model,
      year: responseData.year,
      hasValuation: !!responseData.valuation,
      hasReservePrice: !!responseData.reservePrice,
      propertiesCount: Object.keys(responseData).length,
      timestamp: new Date().toISOString()
    });
    
    perfTracker.complete('success', { 
      dataReceived: true,
      sourceType: isAuthenticated ? 'authenticated' : 'public'
    });
    
    return { 
      success: true, 
      data: responseData 
    };
  } catch (error: any) {
    console.error(`[ValuationService][${requestId}] Error getting valuation:`, { 
      error: error.message,
      stack: error.stack,
      vin, 
      mileage,
      timestamp: new Date().toISOString()
    });
    
    perfTracker.complete('failure', { 
      errorMessage: error.message,
      errorType: error.constructor?.name
    });
    
    return { 
      success: false, 
      error: error.message,
      data: { error: error.message } 
    };
  }
}

/**
 * Clean up valuation data from localStorage
 */
export function cleanupValuationData(): void {
  const startTime = performance.now();
  
  try {
    console.log('[ValuationService] Cleaning up valuation data');
    localStorage.removeItem('valuationData');
    localStorage.removeItem('tempMileage');
    localStorage.removeItem('tempVIN');
    localStorage.removeItem('tempGearbox');
    localStorage.removeItem('valuationTimestamp');
    
    const duration = performance.now() - startTime;
    console.log(`[ValuationService] Cleanup completed in ${duration.toFixed(2)}ms`);
  } catch (error) {
    console.error('[ValuationService] Error during cleanup:', error);
  }
}
