
/**
 * Changes made:
 * - 2024-06-17: Enhanced error handling for valuation failures
 * - 2024-06-18: Added caching layer for valuation requests
 * - 2024-06-18: Implemented non-blocking cache operations
 * - 2024-08-06: Added property normalization layer
 * - 2024-08-06: Fixed TypeScript errors with Promise handling
 * - 2024-08-06: Added better error handling for parallel operations
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType, ValuationData } from "../types";
import { toast } from "sonner";
import { normalizeValuationData } from "../utils/valuationDataNormalizer";
import { extractPrice } from "@/utils/priceExtractor";

/**
 * Timeout duration for cache operations in milliseconds
 */
const CACHE_TIMEOUT = 1500;

/**
 * Get valuation data for a vehicle
 */
export async function getValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
): Promise<{ success: boolean; data: ValuationData }> {
  console.log('Getting valuation for:', { vin, mileage, gearbox });
  
  try {
    // Store basic information in localStorage for potential fallback
    localStorage.setItem("tempVIN", vin);
    localStorage.setItem("tempMileage", mileage.toString());
    localStorage.setItem("tempGearbox", gearbox);

    // Try to get cached data first (non-blocking with timeout)
    let cachedData = null;
    try {
      const cachePromise = getCachedValuation(vin, mileage);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cache lookup timed out')), CACHE_TIMEOUT);
      });
      
      cachedData = await Promise.race([cachePromise, timeoutPromise])
        .catch(error => {
          console.warn('Cache lookup skipped:', error.message);
          return null;
        });
        
      if (cachedData) {
        console.log('Using cached valuation data');
        // Normalize the cached data to ensure consistent property names
        const normalizedCacheData = normalizeValuationData(cachedData);
        return { 
          success: true, 
          data: normalizedCacheData
        };
      }
    } catch (cacheError) {
      console.warn('Cache lookup error:', cacheError);
      // Continue with API request on cache failure
    }

    // If no cache hit, get fresh valuation from API
    console.log('No cache hit, fetching fresh valuation data');
    const response = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { 
        vin, 
        mileage, 
        gearbox 
      }
    });

    if (response.error) {
      console.error('Valuation API error:', response.error);
      throw new Error(`API error: ${response.error.message}`);
    }

    // Check if we have valid data
    if (!response.data || !response.data.make) {
      console.error('Invalid response data:', response.data);
      throw new Error('Received invalid valuation data');
    }

    // Store in cache asynchronously (non-blocking)
    try {
      storeCacheAsync(vin, mileage, response.data);
    } catch (cacheError) {
      console.warn('Failed to store valuation in cache:', cacheError);
      // Don't let cache failures affect the main flow
    }

    // Normalize data before returning to ensure consistent property names
    const normalizedData = normalizeValuationData(response.data);
    
    console.log('Valuation data normalized:', {
      original: response.data,
      normalized: normalizedData
    });

    return {
      success: true,
      data: normalizedData
    };
  } catch (error: any) {
    console.error('Valuation error:', error);
    
    // Try to use any partial data we might have
    return {
      success: false,
      data: {
        error: error.message || 'Failed to get valuation',
        make: localStorage.getItem("tempMake") || '',
        model: localStorage.getItem("tempModel") || '',
        vin: vin
      }
    };
  }
}

/**
 * Get cached valuation data if available
 */
async function getCachedValuation(vin: string, mileage: number): Promise<ValuationData | null> {
  try {
    // Execute two parallel requests - exact match and mileage range
    const rangeTolerance = 1000; // Allow 1000 km difference for cache hits
    
    // Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled([
      // Try exact match first
      supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'get_cached_valuation',
          vin,
          mileage
        }
      }),
      // Try mileage range match as fallback
      supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'get_cached_valuation',
          vin,
          mileage_min: mileage - rangeTolerance,
          mileage_max: mileage + rangeTolerance
        }
      })
    ]);
    
    // Process results - use the first successful response
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const response = result.value;
        
        if (response.data?.success && response.data?.data) {
          console.log('Cache hit success:', response.data?.data);
          return response.data.data;
        }
      }
    }
    
    console.log('No cache hits found');
    return null;
  } catch (error) {
    console.warn('Cache lookup error:', error);
    return null;
  }
}

/**
 * Store valuation data in cache asynchronously
 */
function storeCacheAsync(vin: string, mileage: number, valuationData: any): void {
  // Fire and forget - don't await or let it block the main flow
  setTimeout(() => {
    supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'cache_valuation',
        vin,
        mileage,
        valuation_data: valuationData
      }
    }).then(response => {
      if (response.error) {
        console.warn('Cache storage API error:', response.error);
      } else {
        console.log('Valuation cached successfully');
      }
    }).catch(error => {
      console.warn('Cache storage error:', error);
    });
  }, 0);
}

/**
 * Clean up temporary valuation data from localStorage
 */
export function cleanupValuationData(): void {
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('tempMake');
  localStorage.removeItem('tempModel');
  localStorage.removeItem('valuationData');
}
