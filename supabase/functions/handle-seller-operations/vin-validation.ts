
/**
 * Changes made:
 * - 2024-06-22: Extracted VIN validation functionality from operations.ts
 * - 2024-07-07: Added better error handling, rate limiting, and enhanced logging
 * - 2024-07-15: Added caching for recent VIN validations
 * - 2024-07-18: Enhanced VIN reservation handling for more reliability
 * - 2024-07-22: Refactored into smaller modules for better maintainability
 * - 2025-07-04: Further refactored into dedicated service modules
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { 
  checkRateLimit, 
  logOperation, 
  ValidationError, 
  getCachedValidation
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
      return {
        success: true,
        data: existingCheck.data
      };
    }

    // Check cache first before API calls
    const cachedData = getCachedValidation(vin, mileage);
    if (cachedData) {
      logOperation('using_cached_validation', { requestId, vin, mileage });
      
      // If the cached data indicates the vehicle already exists
      if (cachedData.isExisting) {
        return {
          success: true,
          data: {
            isExisting: true,
            error: 'This vehicle has already been listed'
          }
        };
      }
      
      // If we have a valid cached valuation, process the result
      if (cachedData.make && cachedData.model && cachedData.year) {
        return await processValidationResult(supabase, vin, userId, cachedData, mileage, requestId);
      }
    }

    // Get valuation from external API
    const data = await fetchExternalValuation(vin, mileage, requestId);

    // Calculate base price (average of min and median prices from API)
    const priceMin = data.price_min || data.price;
    const priceMed = data.price_med || data.price;
    const basePrice = (priceMin + priceMed) / 2;
    
    // Get reserve price
    const reservePrice = await calculateReservePrice(supabase, basePrice, requestId);
    
    // Add the reserve price to the data for caching
    const valuationData = {
      ...data,
      reservePrice,
      basePrice
    };
    
    // Process the validation result
    return await processValidationResult(supabase, vin, userId, valuationData, mileage, requestId);

  } catch (error) {
    return handleValidationError(error, vin, requestId);
  }
};
