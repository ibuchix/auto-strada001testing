
/**
 * Changes made:
 * - 2025-05-15: Extracted API calls from valuationService.ts
 * - 2025-12-22: Fixed data normalization and improved error handling
 * - 2025-12-23: Fixed TypeScript errors with spread operator on non-object types
 * - 2025-12-23: Fixed TypeScript errors with property access on dynamic objects
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get cached valuation for VIN
 */
export async function getCachedValuation(vin: string, mileage: number) {
  console.log('Checking cache for VIN:', vin);
  
  try {
    // First try using the security definer function (most reliable approach)
    const { data: funcData, error: funcError } = await supabase.rpc('get_vin_valuation_cache', {
      p_vin: vin,
      p_mileage: mileage,
      p_log_id: crypto.randomUUID()
    });
    
    if (!funcError && funcData) {
      console.log('Cache hit using DB function for VIN:', vin);
      
      // Create a properly typed normalized data object
      let normalizedData: Record<string, any> = {};
      
      // Handle different data types properly
      if (typeof funcData === 'object' && funcData !== null) {
        normalizedData = { ...funcData };
      } else {
        // Handle primitive values
        normalizedData = { valuation: funcData };
      }
      
      // Ensure both valuation and reservePrice exist
      if (normalizedData.valuation !== undefined && normalizedData.reservePrice === undefined) {
        normalizedData.reservePrice = normalizedData.valuation;
      } else if (normalizedData.reservePrice !== undefined && normalizedData.valuation === undefined) {
        normalizedData.valuation = normalizedData.reservePrice;
      }
      
      return normalizedData;
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
        let normalizedData: Record<string, any> = {};
        const valData = data[0].valuation_data;
        
        // Handle different data types properly
        if (typeof valData === 'object' && valData !== null) {
          normalizedData = { ...valData };
        } else {
          // Handle primitive values
          normalizedData = { valuation: valData };
        }
        
        // Ensure both valuation and reservePrice exist
        if (normalizedData.valuation !== undefined && normalizedData.reservePrice === undefined) {
          normalizedData.reservePrice = normalizedData.valuation;
        } else if (normalizedData.reservePrice !== undefined && normalizedData.valuation === undefined) {
          normalizedData.valuation = normalizedData.reservePrice;
        }
        
        return normalizedData;
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
    // First try using the security definer function
    const { error: funcError } = await supabase.rpc('store_vin_valuation_cache', {
      p_vin: vin,
      p_mileage: mileage,
      p_valuation_data: data
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
        valuation_data: data
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
