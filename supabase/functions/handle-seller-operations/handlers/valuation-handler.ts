
/**
 * Valuation handler for seller operations
 * Updated: 2025-04-21 - Fixed import paths to use local utils instead of shared
 * Updated: 2025-04-24 - Removed all caching code to ensure direct API calls
 * Updated: 2025-04-24 - Fixed remaining cache references in log operations
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ValuationRequest } from '../schema-validation.ts';
import { checkExistingEntities, validateVinInput } from '../services/validation-service.ts';
import { fetchVehicleValuation } from '../valuation-service.ts';
import { logOperation, createPerformanceTracker } from '../utils/logging.ts';

export async function handleValuationRequest(
  supabase: SupabaseClient,
  data: ValuationRequest,
  requestId: string
): Promise<{
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  errorCode?: string;
}> {
  // Create performance tracker for monitoring execution times
  const perfTracker = createPerformanceTracker(requestId, 'valuation_request');
  
  try {
    const { vin, mileage, gearbox, userId } = data;
    
    // Log operation start with detailed context
    logOperation('valuation_request_start', { 
      requestId, 
      vin, 
      mileage, 
      gearbox, 
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Validate inputs
    validateVinInput(vin, mileage, userId);
    perfTracker.checkpoint('input_validation');
    
    // Check for existing data
    const existingCheckStartTime = performance.now();
    const existingCheck = await checkExistingEntities(supabase, vin, userId, mileage, requestId);
    perfTracker.checkpoint('existing_check');
    
    logOperation('existing_entities_check', { 
      requestId, 
      vin,
      isExistingReservation: existingCheck.isExistingReservation,
      isExistingVehicle: existingCheck.isExistingVehicle,
      executionTimeMs: (performance.now() - existingCheckStartTime).toFixed(2),
      timestamp: new Date().toISOString()
    });
    
    if (existingCheck.isExistingReservation) {
      // This is not a cache - it's a valid business record
      logOperation('found_existing_reservation', { 
        requestId, 
        vin,
        timestamp: new Date().toISOString(),
        dataFields: existingCheck.data ? Object.keys(existingCheck.data) : []
      });
      
      // Ensure data has consistent property names
      if (existingCheck.data) {
        // Make sure both valuation and reservePrice exist (for backwards compatibility)
        if (existingCheck.data.valuation !== undefined && existingCheck.data.reservePrice === undefined) {
          existingCheck.data.reservePrice = existingCheck.data.valuation;
        } else if (existingCheck.data.reservePrice !== undefined && existingCheck.data.valuation === undefined) {
          existingCheck.data.valuation = existingCheck.data.reservePrice;
        }
      }
      
      perfTracker.complete('success', { 
        source: 'existing_reservation', 
        vin, 
        mileage 
      });
      
      return {
        success: true,
        data: existingCheck.data
      };
    }
    
    if (existingCheck.isExistingVehicle) {
      logOperation('vehicle_already_exists', { 
        requestId, 
        vin,
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', { 
        reason: 'vehicle_already_exists', 
        vin 
      });
      
      return {
        success: false,
        data: existingCheck.data,
        error: 'This vehicle has already been listed',
        errorCode: 'VEHICLE_ALREADY_EXISTS'
      };
    }
    
    // Log external API request start
    logOperation('direct_api_valuation_start', { 
      requestId, 
      vin,
      mileage,
      gearbox,
      timestamp: new Date().toISOString()
    });
    
    // Time the external API call - always call external API, no caching
    const apiStartTime = performance.now();
    const valuationResult = await fetchVehicleValuation(vin, mileage, gearbox, requestId);
    const apiCallDuration = performance.now() - apiStartTime;
    
    perfTracker.checkpoint('external_api_call');
    
    // Log external API result
    logOperation('external_valuation_result', { 
      requestId, 
      vin,
      success: valuationResult.success,
      error: valuationResult.error || null,
      durationMs: apiCallDuration.toFixed(2),
      timestamp: new Date().toISOString()
    });
    
    if (!valuationResult.success) {
      perfTracker.complete('failure', { 
        reason: valuationResult.errorCode || 'valuation_error', 
        error: valuationResult.error 
      });
      
      return {
        success: false,
        error: valuationResult.error || 'Failed to get valuation',
        errorCode: valuationResult.errorCode || 'VALUATION_ERROR'
      };
    }
    
    // Ensure consistent property names in API response
    if (valuationResult.data) {
      // Make sure both valuation and reservePrice exist
      if (valuationResult.data.valuation !== undefined && valuationResult.data.reservePrice === undefined) {
        valuationResult.data.reservePrice = valuationResult.data.valuation;
      } else if (valuationResult.data.reservePrice !== undefined && valuationResult.data.valuation === undefined) {
        valuationResult.data.valuation = valuationResult.data.reservePrice;
      }
    }
    
    // Store in VIN reservations if not already present
    try {
      // Log reservation attempt
      logOperation('creating_vin_reservation', { 
        requestId, 
        vin,
        userId,
        timestamp: new Date().toISOString()
      }, 'debug');
      
      // Store reservation
      supabase
        .from('vin_reservations')
        .insert({
          vin,
          user_id: userId,
          valuation_data: valuationResult.data,
          // Will expire after 24 hours (handled by default value in table)
        })
        .onConflict('vin')
        .ignore()
        .then(result => {
          if (result.error) {
            logOperation('reservation_store_error', { 
              requestId, 
              vin, 
              error: result.error.message,
              timestamp: new Date().toISOString()
            }, 'warn');
          }
        })
        .catch(error => {
          logOperation('reservation_store_exception', { 
            requestId, 
            vin, 
            error: error.message,
            timestamp: new Date().toISOString()
          }, 'warn');
        });
    } catch (reservationError) {
      // Just log, don't affect main flow
      logOperation('reservation_store_exception', { 
        requestId, 
        vin, 
        error: reservationError.message,
        timestamp: new Date().toISOString()
      }, 'warn');
    }
    
    perfTracker.complete('success', { 
      source: 'external_api',
      vin,
      hasData: !!valuationResult.data,
      dataFields: valuationResult.data ? Object.keys(valuationResult.data) : []
    });
    
    logOperation('valuation_request_complete', { 
      requestId, 
      vin,
      success: true,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      data: valuationResult.data
    };
  } catch (error) {
    perfTracker.complete('error', { 
      errorType: error.constructor?.name,
      errorMessage: error.message
    });
    
    logOperation('valuation_request_error', { 
      requestId, 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, 'error');
    
    return {
      success: false,
      error: error.message || 'An error occurred during valuation',
      errorCode: error.code || 'VALUATION_PROCESSING_ERROR'
    };
  }
}
