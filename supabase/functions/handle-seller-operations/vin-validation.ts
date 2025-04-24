
/**
 * Changes made:
 * - 2024-06-22: Extracted VIN validation functionality from operations.ts
 * - 2024-07-07: Added better error handling, rate limiting, and enhanced logging
 * - 2024-07-15: Added caching for recent VIN validations
 * - 2024-07-18: Enhanced VIN reservation handling for more reliability
 * - 2024-07-22: Refactored into smaller modules for better maintainability
 * - 2025-07-04: Further refactored into dedicated service modules
 * - 2025-12-22: Fixed valuation data processing and property name consistency
 * - 2025-04-24: Removed all caching functionality
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { 
  checkRateLimit, 
  logOperation, 
  ValidationError
} from './utils.ts';
import { fetchExternalValuation, calculateReservePrice } from './external-api.ts';
import { 
  validateVinInput, 
  checkExistingEntities 
} from './services/validation-service.ts';
import {
  processValidationResult,
  handleValidationError
} from './services/validation-processor.ts';

export const validateVin = async (
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  mileage: number,
  gearbox: string,
  userId: string
) => {
  const requestId = crypto.randomUUID();
  logOperation('validateVin_start', { requestId, vin, mileage, gearbox, userId });

  try {
    // Validate input parameters
    validateVinInput(vin, mileage, userId);
    
    // Apply rate limiting
    if (checkRateLimit(vin)) {
      throw new ValidationError('Too many requests for this VIN. Please try again later.', 'RATE_LIMIT_EXCEEDED');
    }

    // Check for existing reservation or vehicle
    const existingCheck = await checkExistingEntities(supabase, vin, userId, mileage, requestId);
    if (existingCheck.isExistingReservation || existingCheck.isExistingVehicle) {
      logOperation('found_existing_entity', { 
        requestId, 
        vin,
        isReservation: existingCheck.isExistingReservation,
        isVehicle: existingCheck.isExistingVehicle
      });
      return {
        success: true,
        data: existingCheck.data
      };
    }

    // Get valuation from external API - always fetch fresh data
    const data = await fetchExternalValuation(vin, mileage, requestId);
    logOperation('external_valuation_received', { 
      requestId, 
      vin,
      hasData: !!data,
      hasPricing: !!(data.price_min || data.price_med || data.price)
    });

    // Calculate base price (average of min and median prices from API)
    const priceMin = data.price_min || data.price || 0;
    const priceMed = data.price_med || data.price || 0;
    
    if (priceMin <= 0 || priceMed <= 0) {
      logOperation('invalid_pricing_data', { 
        requestId, 
        vin,
        priceMin,
        priceMed
      }, 'error');
      
      return {
        success: false,
        data: {
          error: 'Could not retrieve valid pricing data for this vehicle',
          vin,
          transmission: gearbox
        }
      };
    }
    
    const basePrice = (priceMin + priceMed) / 2;
    logOperation('base_price_calculated', { 
      requestId, 
      vin,
      priceMin,
      priceMed,
      basePrice
    });
    
    // Get reserve price
    const reservePrice = await calculateReservePrice(supabase, basePrice, requestId);
    
    // Add the reserve price to the data
    const valuationData = {
      ...data,
      reservePrice,
      valuation: reservePrice, // Add both property names for consistency
      basePrice,
      averagePrice: basePrice
    };
    
    logOperation('valuation_data_prepared', { 
      requestId, 
      vin,
      make: data.make,
      model: data.model,
      year: data.year,
      reservePrice,
      basePrice
    });
    
    // Process the validation result
    return await processValidationResult(supabase, vin, userId, valuationData, mileage, requestId);

  } catch (error) {
    return handleValidationError(error, vin, requestId);
  }
};
