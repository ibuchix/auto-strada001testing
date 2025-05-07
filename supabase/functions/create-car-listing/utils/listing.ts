
/**
 * Updated: 2025-07-22 - Added improved error handling with schema validation
 * Updated: 2025-05-07 - Ensure price is set from reservePrice or valuation
 * Enhanced error handling for schema mismatches and column type issues
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "./logging.ts";

// Define common schema error patterns to detect
const SCHEMA_ERROR_PATTERNS = [
  { pattern: /column "(.*?)" does not exist/, type: 'MISSING_COLUMN' },
  { pattern: /value too long for type/, type: 'VALUE_TOO_LONG' },
  { pattern: /invalid input syntax for type/, type: 'TYPE_MISMATCH' },
  { pattern: /violates not-null constraint/, type: 'NULL_CONSTRAINT' },
  { pattern: /violates foreign key constraint/, type: 'FOREIGN_KEY' }
];

/**
 * Create a car listing with robust error handling
 */
export async function createListing(
  supabase: SupabaseClient,
  carData: Record<string, any>,
  userId: string,
  requestId: string
) {
  try {
    logOperation('listing_creation_start', {
      requestId,
      userId,
      carKeys: Object.keys(carData),
      hasPrice: carData.price !== undefined,
      priceValue: carData.price
    });

    // Ensure price is set to avoid null constraint violations
    if (!carData.price && carData.valuation_data) {
      // Use reservePrice if available, otherwise use valuation
      if (carData.valuation_data.reservePrice) {
        carData.price = carData.valuation_data.reservePrice;
        logOperation('price_fixed_from_reserve', {
          requestId,
          priceSource: 'reservePrice',
          price: carData.price
        });
      } else if (carData.valuation_data.valuation) {
        carData.price = carData.valuation_data.valuation;
        logOperation('price_fixed_from_valuation', {
          requestId,
          priceSource: 'valuation',
          price: carData.price
        });
      }
    }

    // First approach: Use the upsert_car_listing function
    try {
      const { data: upsertResult, error: upsertError } = await supabase.rpc(
        'upsert_car_listing',
        { 
          car_data: {
            ...carData,
            seller_id: userId
          },
          is_draft: true
        }
      );
      
      if (!upsertError) {
        logOperation('create_listing_upsert_success', {
          requestId,
          userId,
          result: upsertResult
        });
        
        return {
          success: true,
          data: { car_id: upsertResult.car_id, id: upsertResult.car_id }
        };
      }
      
      // Log the error but continue to try alternative methods
      logOperation('create_listing_upsert_error', {
        requestId,
        userId,
        error: upsertError.message,
        details: upsertError
      }, 'warn');
    } catch (upsertException) {
      logOperation('create_listing_upsert_exception', {
        requestId,
        error: (upsertException as Error).message
      }, 'warn');
    }
    
    // Second approach: Direct insertion
    // Prepare car data with seller ID
    const carInsertData = {
      ...carData,
      seller_id: userId,
      is_draft: true
    };
    
    logOperation('trying_direct_insert', {
      requestId,
      userId,
      fields: Object.keys(carInsertData),
      price: carInsertData.price
    });
    
    const { data: car, error: insertError } = await supabase
      .from('cars')
      .insert(carInsertData)
      .select('id')
      .single();
      
    if (insertError) {
      // Check for schema-related errors
      const schemaError = detectSchemaError(insertError.message);
      
      if (schemaError) {
        logOperation('create_listing_schema_error', {
          requestId,
          userId,
          errorType: schemaError.type,
          message: insertError.message,
          affectedField: schemaError.field
        }, 'error');
        
        return {
          success: false,
          error: new Error(`Schema error: ${schemaError.message || insertError.message}`),
          details: {
            errorType: schemaError.type,
            field: schemaError.field
          },
          code: 'SCHEMA_ERROR'
        };
      }
      
      // Log the general error
      logOperation('create_listing_error', {
        requestId,
        userId,
        error: insertError.message
      }, 'error');
      
      return {
        success: false,
        error: new Error(`Database error: ${insertError.message}`)
      };
    }
    
    logOperation('create_listing_success', {
      requestId,
      userId,
      carId: car.id
    });
    
    return {
      success: true,
      data: { id: car.id, car_id: car.id }
    };
  } catch (error: any) {
    logOperation('create_listing_exception', {
      requestId,
      userId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Helper to detect and categorize schema errors
 */
function detectSchemaError(errorMessage: string): { type: string; field?: string; message?: string } | null {
  for (const errorPattern of SCHEMA_ERROR_PATTERNS) {
    const match = errorMessage.match(errorPattern.pattern);
    if (match) {
      const field = match[1] || 'unknown';
      
      let message = '';
      switch (errorPattern.type) {
        case 'MISSING_COLUMN':
          message = `The field "${field}" is missing from the database schema.`;
          break;
        case 'VALUE_TOO_LONG':
          message = `Value too long for field "${field}".`;
          break;
        case 'TYPE_MISMATCH':
          message = `Invalid data type provided for a field.`;
          break;
        case 'NULL_CONSTRAINT':
          message = `Required field cannot be null.`;
          break;
        case 'FOREIGN_KEY':
          message = `Referenced record does not exist.`;
          break;
        default:
          message = `Schema error with field "${field}".`;
      }
      
      return {
        type: errorPattern.type,
        field,
        message
      };
    }
  }
  
  return null;
}
