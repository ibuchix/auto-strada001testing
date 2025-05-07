
/**
 * Listing utilities for create-car-listing
 * Created: 2025-05-08 - Added to support better listing creation
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "./logging.ts";

/**
 * Creates a new car listing
 * 
 * @param supabase Supabase client
 * @param listingData Car listing data
 * @param userId User ID
 * @param requestId Request ID for tracking
 * @returns Result with success flag
 */
export async function createListing(
  supabase: SupabaseClient,
  listingData: any,
  userId: string,
  requestId: string
): Promise<{ success: boolean; data?: any; error?: Error }> {
  try {
    logOperation('create_listing_start', { 
      requestId, 
      userId,
      make: listingData.make,
      model: listingData.model
    });
    
    // Try to use the create_car_listing function if available
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_car_listing',
      { 
        p_car_data: listingData,
        p_user_id: userId
      }
    );
    
    if (!rpcError && rpcResult?.success) {
      logOperation('listing_created_via_rpc', { 
        requestId, 
        userId,
        carId: rpcResult.car_id
      });
      
      return { 
        success: true, 
        data: { car_id: rpcResult.car_id }
      };
    }
    
    // If RPC fails, fall back to direct insert
    if (rpcError) {
      logOperation('rpc_create_failed', {
        requestId,
        userId,
        error: rpcError.message,
        fallback: 'trying direct insert'
      }, 'warn');
      
      // Direct insert as fallback
      const { data: inserted, error: insertError } = await supabase
        .from('cars')
        .insert(listingData)
        .select('id')
        .single();
      
      if (insertError) {
        logOperation('direct_insert_failed', {
          requestId,
          userId,
          error: insertError.message
        }, 'error');
        
        return { 
          success: false, 
          error: new Error(insertError.message)
        };
      }
      
      logOperation('listing_created_direct', { 
        requestId, 
        userId,
        carId: inserted.id
      });
      
      return { 
        success: true, 
        data: { id: inserted.id }
      };
    }
    
    // If we get here, the RPC returned an error in the data
    logOperation('listing_creation_rpc_data_error', { 
      requestId, 
      userId,
      error: rpcResult?.error || 'Unknown RPC error'
    }, 'error');
    
    return {
      success: false,
      error: new Error(rpcResult?.error || 'Failed to create listing')
    };
  } catch (error) {
    logOperation('listing_creation_exception', { 
      requestId, 
      userId,
      error: (error as Error).message
    }, 'error');
    
    return {
      success: false,
      error: error as Error
    };
  }
}
