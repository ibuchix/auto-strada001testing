
/**
 * Listing utilities for create-car-listing
 * Created: 2025-05-08 - Added to support better listing creation
 * Updated: 2025-05-17 - Enhanced error handling and added multiple fallback approaches
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

    // First approach: Try to use the security definer function directly (most reliable)
    try {
      const { data: funcResult, error: funcError } = await supabase.rpc(
        'create_car_listing',
        { 
          p_car_data: { ...listingData, seller_id: userId },
          p_user_id: userId
        }
      );
      
      if (!funcError && funcResult?.success) {
        logOperation('listing_created_via_definer_func', { 
          requestId, 
          userId,
          carId: funcResult.car_id
        });
        
        return { 
          success: true, 
          data: { car_id: funcResult.car_id, id: funcResult.car_id }
        };
      }
      
      if (funcError) {
        logOperation('definer_func_error', {
          requestId,
          userId,
          error: funcError.message
        }, 'warn');
      }
    } catch (error) {
      logOperation('definer_func_exception', {
        requestId,
        userId,
        error: (error as Error).message
      }, 'warn');
    }
    
    // Second approach: Try to use the upsert_car_listing function
    try {
      const { data: upsertResult, error: upsertError } = await supabase.rpc(
        'upsert_car_listing',
        { 
          car_data: { ...listingData, seller_id: userId },
          is_draft: true
        }
      );
      
      if (!upsertError && upsertResult?.success) {
        logOperation('listing_created_via_upsert_func', { 
          requestId, 
          userId,
          carId: upsertResult.car_id
        });
        
        return { 
          success: true, 
          data: { car_id: upsertResult.car_id, id: upsertResult.car_id }
        };
      }
      
      if (upsertError) {
        logOperation('upsert_func_error', {
          requestId,
          userId,
          error: upsertError.message
        }, 'warn');
      }
    } catch (error) {
      logOperation('upsert_func_exception', {
        requestId,
        userId,
        error: (error as Error).message
      }, 'warn');
    }
    
    // Final approach: Direct insert as fallback
    logOperation('using_direct_insert', {
      requestId,
      userId
    }, 'warn');
    
    const { data: inserted, error: insertError } = await supabase
      .from('cars')
      .insert({
        ...listingData,
        seller_id: userId,
        is_draft: true
      })
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
      data: { car_id: inserted.id, id: inserted.id }
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
