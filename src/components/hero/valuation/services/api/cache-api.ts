
/**
 * Changes made:
 * - 2025-05-15: Extracted API calls from valuationService.ts
 * - 2025-12-22: Fixed data normalization and improved error handling
 * - 2025-12-23: Fixed TypeScript errors with spread operator on non-object types
 * - 2025-12-23: Fixed TypeScript errors with property access on dynamic objects
 * - 2026-04-10: Added strict type checking and proper data normalization
 * - 2026-04-03: Updated to use new security definer functions with correlation IDs
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationData } from "../../types";

/**
 * Get cached valuation for VIN
 */
export async function getCachedValuation(vin: string, mileage: number): Promise<ValuationData | null> {
  console.log('Checking cache for VIN:', vin);
  
  try {
    // Generate a correlation ID for tracing this request through logs
    const correlationId = crypto.randomUUID();
    
    // First try using the security definer function (most reliable approach)
    const { data: funcData, error: funcError } = await supabase.rpc('get_vin_valuation_cache', {
      p_vin: vin,
      p_mileage: mileage,
      p_log_id: correlationId
    });
    
    if (!funcError && funcData) {
      console.log('Cache hit using DB function for VIN:', vin);
      
      // Create a properly typed normalized data object
      const normalizedData: Record<string, any> = {};
      
      // Handle different data types properly
      if (typeof funcData === 'object' && funcData !== null) {
        // Copy all properties
        Object.keys(funcData).forEach(key => {
          normalizedData[key] = funcData[key];
        });
      } else {
        // Handle primitive values
        normalizedData.valuation = funcData;
      }
      
      // Ensure both valuation and reservePrice exist
      if ('valuation' in normalizedData && !('reservePrice' in normalizedData)) {
        normalizedData.reservePrice = normalizedData.valuation;
      } else if ('reservePrice' in normalizedData && !('valuation' in normalizedData)) {
        normalizedData.valuation = normalizedData.reservePrice;
      }
      
      return normalizedData as ValuationData;
    }
    
    // Fallback to direct query if function approach failed
    console.log('DB function cache check failed, trying direct query');
    
    const { data, error } = await supabase
      .from('vin_valuation_cache')
      .select('*')
      .eq('vin', vin)
      .gte('mileage', mileage * 0.95)
      .lte('mileage', mileage * 1.05)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error querying cache:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log('Cache hit using direct query for VIN:', vin);
      
      // Check if cache is valid (30 days)
      const cacheDate = new Date(data[0].created_at);
      const now = new Date();
      const daysDifference = (now.getTime() - cacheDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysDifference <= 30) {
        // Create a properly typed normalized data object
        const normalizedData: Record<string, any> = {};
        const valData = data[0].valuation_data;
        
        // Handle different data types properly
        if (typeof valData === 'object' && valData !== null) {
          // Copy all properties
          Object.keys(valData).forEach(key => {
            normalizedData[key] = valData[key];
          });
        } else {
          // Handle primitive values
          normalizedData.valuation = valData;
        }
        
        // Ensure both valuation and reservePrice exist
        if ('valuation' in normalizedData && !('reservePrice' in normalizedData)) {
          normalizedData.reservePrice = normalizedData.valuation;
        } else if ('reservePrice' in normalizedData && !('valuation' in normalizedData)) {
          normalizedData.valuation = normalizedData.reservePrice;
        }
        
        return normalizedData as ValuationData;
      }
      
      console.log('Cache expired for VIN:', vin);
    }
    
    console.log('No cache found for VIN:', vin);
    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    // Don't let cache errors disrupt the main flow
    return null;
  }
}

/**
 * Store valuation data in the cache
 */
export async function storeValuationInCache(
  vin: string, 
  mileage: number, 
  data: any
): Promise<boolean> {
  console.log('Attempting to cache valuation data for VIN:', vin);
  
  try {
    // Generate a correlation ID for tracing this operation
    const correlationId = crypto.randomUUID();
    
    // Ensure we're storing a proper object
    const normalizedData = typeof data === 'object' && data !== null ? 
      { ...data } : { valuation: data };
    
    // First try using the security definer function
    const { error: funcError } = await supabase.rpc('store_vin_valuation_cache', {
      p_vin: vin,
      p_mileage: mileage,
      p_valuation_data: normalizedData,
      p_log_id: correlationId
    });
    
    if (!funcError) {
      console.log('Successfully cached valuation using DB function for VIN:', vin);
      return true;
    }
    
    console.warn('DB function cache storage failed, trying edge function:', funcError);
    
    // Fallback to edge function if direct approach failed
    const { data: edgeFuncData, error: edgeFuncError } = await supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'cache_valuation',
        vin,
        mileage,
        valuation_data: normalizedData,
        correlation_id: correlationId
      }
    });
    
    if (edgeFuncError) {
      console.error('Edge function cache error:', edgeFuncError);
      return false;
    }
    
    console.log('Successfully cached valuation using edge function for VIN:', vin);
    return true;
  } catch (error) {
    console.error('Error caching valuation data:', error);
    return false;
  }
}

/**
 * Fetch valuation data for home page context
 */
export async function fetchHomeValuation(
  vin: string,
  mileage: number,
  gearbox: string
) {
  console.log('Fetching home valuation from API for:', { vin, mileage, gearbox });
  
  // Generate a correlation ID for this request
  const correlationId = crypto.randomUUID();
  
  return await supabase.functions.invoke('get-vehicle-valuation', {
    body: { 
      vin, 
      mileage, 
      gearbox, 
      context: 'home',
      correlation_id: correlationId
    },
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
  
  // Generate a correlation ID for this request
  const correlationId = crypto.randomUUID();
  
  return await supabase.functions.invoke('handle-seller-operations', {
    body: {
      operation: 'validate_vin',
      vin,
      mileage,
      gearbox,
      userId,
      correlation_id: correlationId
    }
  });
}
