
/**
 * Changes made:
 * - 2024-08-01: Created caching API for valuation results
 * - 2024-08-02: Fixed type issues with ValuationData
 * - 2024-12-31: Updated to use security definer function for reliable caching
 * - 2025-03-21: Fixed TypeScript error with onConflict method
 * - 2025-04-22: Enhanced error handling and added anonymous access for caching
 * - 2025-04-23: Improved security definer function interaction with detailed logging
 * - 2025-04-24: Fixed TypeScript type error with p_log_id parameter
 * - 2025-04-25: Fixed TypeScript error with RPC function parameter types
 * - 2025-04-26: Added comprehensive debug logging for authentication and error tracking
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationData } from "../../types";

const CACHE_EXPIRY_DAYS = 30; // Cache validity period in days

/**
 * Check if a cached valuation exists for a given VIN and mileage
 */
export async function getCachedValuation(
  vin: string,
  mileage: number
): Promise<ValuationData | null> {
  console.log('Checking for cached valuation for VIN:', vin);

  try {
    // Debug information about the current session
    const sessionInfo = await getSessionDebugInfo();
    console.log('Session info when checking cache:', sessionInfo);

    // Query the database for cached valuations
    const { data, error } = await supabase
      .from('vin_valuation_cache')
      .select('*')
      .eq('vin', vin)
      // Only get cache entries where the mileage is within 5% of the requested mileage
      .gte('mileage', mileage * 0.95)
      .lte('mileage', mileage * 1.05)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching cached valuation:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    if (!data || data.length === 0) {
      console.log('No cache found for VIN:', vin);
      return null;
    }

    const cachedEntry = data[0];
    
    // Check if cache is expired
    const cacheDate = new Date(cachedEntry.created_at);
    const now = new Date();
    const daysDifference = (now.getTime() - cacheDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDifference > CACHE_EXPIRY_DAYS) {
      console.log('Cache expired for VIN:', vin);
      return null;
    }

    console.log('Found valid cache for VIN:', vin, 'created on:', cachedEntry.created_at);
    // Ensure we return a proper ValuationData object
    return cachedEntry.valuation_data as ValuationData;
  } catch (error) {
    console.error('Unexpected error in getCachedValuation:', error);
    return null;
  }
}

/**
 * Helper function to get detailed session information for debugging
 */
async function getSessionDebugInfo(): Promise<any> {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        status: 'error',
        message: error.message,
        error: error
      };
    }
    
    return {
      status: 'success',
      hasSession: !!sessionData?.session,
      isExpired: sessionData?.session ? new Date(sessionData.session.expires_at * 1000) < new Date() : null,
      userInfo: sessionData?.session?.user ? {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email,
        role: sessionData.session.user.app_metadata?.role || 'unknown'
      } : null,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      status: 'error',
      message: e instanceof Error ? e.message : 'Unknown error getting session',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Store valuation data in the cache using enhanced security definer function
 * with improved error handling and detailed logging
 */
export async function storeValuationCache(
  vin: string,
  mileage: number,
  valuationData: ValuationData
): Promise<boolean> {
  console.log('Attempting to store valuation in cache for VIN:', vin);
  
  try {
    // Get detailed session information for debugging
    const sessionInfo = await getSessionDebugInfo();
    console.log('Session info when storing cache:', sessionInfo);
    
    // Check if user is authenticated first - this will affect which approach we use
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData?.session?.user;
    
    if (isAuthenticated) {
      console.log('User is authenticated, using primary caching approach');
      console.log('Authentication details:', {
        userId: sessionData?.session?.user.id,
        email: sessionData?.session?.user.email,
        tokenExpiry: sessionData?.session?.expires_at ? 
          new Date(sessionData.session.expires_at * 1000).toISOString() : 'unknown'
      });
    } else {
      console.log('User is not authenticated, will try security definer function');
    }
    
    // Generate a unique log ID for tracking this operation
    const logId = `cache_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log('Operation tracking ID:', logId);
    
    // Try using the enhanced security definer function with improved error handling
    // Use a type assertion to handle the additional parameter
    console.log('Calling store_vin_valuation_cache RPC with params:', {
      vin,
      mileage,
      valuationData: JSON.stringify(valuationData).substring(0, 100) + '...',
      logId
    });
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'store_vin_valuation_cache',
      {
        p_vin: vin,
        p_mileage: mileage,
        p_valuation_data: valuationData,
        p_log_id: logId
      } as any  // Use type assertion to bypass TypeScript checking
    );
    
    if (rpcError) {
      console.error('Security definer function failed with error:', rpcError);
      
      // Log detailed information about the error for debugging
      console.error('Error details:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code,
        stackTrace: new Error().stack
      });
      
      // If authenticated, attempt direct database insert as fallback
      if (isAuthenticated) {
        console.log('Attempting direct insert as authenticated user fallback');
        return await attemptDirectInsert(vin, mileage, valuationData);
      } else {
        console.log('Skipping cache storage - user not authenticated and security definer failed');
        return false;
      }
    }
    
    console.log('Successfully stored valuation in cache via security definer function:', rpcData);
    return true;
  } catch (error) {
    console.error('Unexpected error in storeValuationCache:', error);
    console.error('Stack trace:', new Error().stack);
    // Don't throw the error, just log it as this is a non-critical operation
    return false;
  }
}

/**
 * Helper function to attempt direct insert into cache table
 * Only used as a fallback when the security definer function fails
 */
async function attemptDirectInsert(
  vin: string,
  mileage: number,
  valuationData: ValuationData
): Promise<boolean> {
  try {
    console.log('Starting direct insert fallback for VIN:', vin);
    
    // Try to find existing entry first
    const { data: existingData, error: selectError } = await supabase
      .from('vin_valuation_cache')
      .select('id')
      .eq('vin', vin)
      .maybeSingle();
      
    if (selectError) {
      console.error('Error checking existing cache entry:', selectError);
      console.error('Error details:', {
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint,
        code: selectError.code
      });
      return false;
    }
    
    if (existingData) {
      console.log('Found existing cache entry, will update. ID:', existingData.id);
      
      // Update existing record
      const { error } = await supabase
        .from('vin_valuation_cache')
        .update({
          mileage,
          valuation_data: valuationData,
          created_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      if (error) {
        console.error('Error updating valuation cache:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      } else {
        console.log('Successfully updated existing cache entry via direct update');
        return true;
      }
    } else {
      console.log('No existing cache entry found, will insert new one');
      
      // Insert new record
      const { error } = await supabase
        .from('vin_valuation_cache')
        .insert([
          {
            vin,
            mileage,
            valuation_data: valuationData
          }
        ]);
        
      if (error) {
        console.error('Error inserting valuation cache:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      } else {
        console.log('Successfully inserted new cache entry via direct insert');
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to store valuation in cache via direct insert:', error);
    console.error('Stack trace:', new Error().stack);
    return false;
  }
}
