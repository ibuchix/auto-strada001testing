
/**
 * Listing utilities for create-car-listing
 * Created: 2025-05-08 - Added to support better listing creation
 * Updated: 2025-05-17 - Enhanced error handling and added multiple fallback approaches
 * Updated: 2025-05-18 - Added better database error handling and diagnostics
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
): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: Error;
  details?: Record<string, any>;
  code?: string;
}> {
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
          error: funcError.message,
          details: funcError,
          code: funcError.code
        }, 'warn');
        
        // Check for specific database errors
        if (funcError.message && (
            funcError.message.includes('column') && 
            funcError.message.includes('does not exist')
        )) {
          return {
            success: false,
            error: new Error("Database schema mismatch. Missing column detected."),
            details: { originalError: funcError.message },
            code: 'SCHEMA_ERROR'
          };
        }
      }
    } catch (error) {
      logOperation('definer_func_exception', {
        requestId,
        userId,
        error: (error as Error).message,
        stack: (error as Error).stack
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
          error: upsertError.message,
          details: upsertError,
          code: upsertError.code
        }, 'warn');
        
        // Check for specific database errors
        if (upsertError.message && (
            upsertError.message.includes('column') && 
            upsertError.message.includes('does not exist')
        )) {
          return {
            success: false,
            error: new Error("Database schema mismatch during upsert. Missing column detected."),
            details: { originalError: upsertError.message },
            code: 'SCHEMA_ERROR'
          };
        }
      }
    } catch (error) {
      logOperation('upsert_func_exception', {
        requestId,
        userId,
        error: (error as Error).message,
        stack: (error as Error).stack
      }, 'warn');
    }
    
    // Final approach: Direct insert as fallback
    logOperation('using_direct_insert', {
      requestId,
      userId
    }, 'warn');
    
    try {
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
          error: insertError.message,
          details: insertError,
          code: insertError.code
        }, 'error');
        
        // Check for schema errors
        if (insertError.message && (
            insertError.message.includes('column') && 
            insertError.message.includes('does not exist')
        )) {
          const columnMatch = insertError.message.match(/column "([^"]+)" of relation/);
          const missingColumn = columnMatch ? columnMatch[1] : "unknown";
          
          return {
            success: false,
            error: new Error(`Database schema mismatch. The column "${missingColumn}" is missing.`),
            details: { 
              originalError: insertError.message,
              missingColumn: missingColumn,
              fields: Object.keys(listingData)
            },
            code: 'SCHEMA_ERROR'
          };
        }
        
        return { 
          success: false, 
          error: new Error(insertError.message),
          details: insertError,
          code: insertError.code
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
      logOperation('direct_insert_exception', {
        requestId,
        userId,
        error: (error as Error).message,
        stack: (error as Error).stack
      }, 'error');
      
      return {
        success: false,
        error: error as Error,
        details: { message: (error as Error).message },
        code: 'INSERT_EXCEPTION'
      };
    }
  } catch (error) {
    logOperation('listing_creation_exception', { 
      requestId, 
      userId,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, 'error');
    
    return {
      success: false,
      error: error as Error,
      details: { message: (error as Error).message },
      code: 'UNEXPECTED_ERROR'
    };
  }
}
