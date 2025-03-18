
/**
 * Changes made:
 * - 2024-06-22: Extracted VIN validation functionality from operations.ts
 * - 2024-07-07: Added better error handling, rate limiting, and enhanced logging
 * - 2024-07-15: Added caching for recent VIN validations
 * - 2024-07-18: Enhanced VIN reservation handling for more reliability
 * - 2024-07-22: Refactored into smaller modules for better maintainability
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { 
  checkRateLimit, 
  logOperation, 
  ValidationError, 
  getCachedValidation,
  cacheValidation
} from './utils.ts';
import { validateReservation, createVinReservation } from './reservation-service.ts';
import { fetchExternalValuation, calculateReservePrice } from './external-api.ts';
import { checkVehicleExists } from './vehicle-checker.ts';

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
    // Check input validity
    if (!vin || vin.length < 11) {
      throw new ValidationError('Invalid VIN format', 'INVALID_VIN_FORMAT');
    }
    
    if (!mileage || mileage < 0) {
      throw new ValidationError('Invalid mileage value', 'INVALID_MILEAGE');
    }
    
    if (!userId) {
      throw new ValidationError('User ID is required', 'MISSING_USER_ID');
    }

    // Apply rate limiting
    if (checkRateLimit(vin)) {
      throw new ValidationError('Too many requests for this VIN. Please try again later.', 'RATE_LIMIT_EXCEEDED');
    }

    // Check if a valid reservation already exists for this user and VIN
    const reservationCheck = await validateReservation(supabase, vin, userId);
    if (reservationCheck.valid && reservationCheck.reservation) {
      logOperation('using_existing_reservation', { 
        requestId, 
        vin, 
        reservationId: reservationCheck.reservation.id 
      });
      
      // Get the valuation data from the reservation
      const valuationData = reservationCheck.reservation.valuation_data;
      
      // If we have valid data in the existing reservation, return it
      if (valuationData && valuationData.make && valuationData.model && valuationData.year) {
        return {
          success: true,
          data: {
            make: valuationData.make,
            model: valuationData.model,
            year: valuationData.year,
            valuation: valuationData.price || valuationData.valuation,
            averagePrice: valuationData.averagePrice,
            reservePrice: valuationData.reservePrice,
            reservationId: reservationCheck.reservation.id
          }
        };
      }
    }

    // Check cache first before database and API calls
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
      
      // If we have a valid cached valuation, create a reservation and return the data
      if (cachedData.make && cachedData.model && cachedData.year) {
        logOperation('create_reservation_from_cache', { 
          requestId, 
          vin, 
          make: cachedData.make, 
          model: cachedData.model 
        });
        
        // Create a reservation for this VIN
        const reservation = await createVinReservation(supabase, vin, userId, cachedData);
        
        // Store reservation ID in response to be saved in localStorage
        return {
          success: true,
          data: {
            make: cachedData.make,
            model: cachedData.model,
            year: cachedData.year,
            valuation: cachedData.price || cachedData.valuation,
            averagePrice: cachedData.averagePrice,
            reservePrice: cachedData.reservePrice,
            reservationId: reservation.id
          }
        };
      }
    }

    // Check if vehicle already exists
    const vehicleExists = await checkVehicleExists(supabase, vin, mileage, requestId);
    if (vehicleExists) {
      return {
        success: true,
        data: {
          isExisting: true,
          error: 'This vehicle has already been listed'
        }
      };
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
    
    // Cache the valuation data
    cacheValidation(vin, valuationData, mileage);

    // Create a reservation for this VIN
    const reservation = await createVinReservation(supabase, vin, userId, valuationData);

    logOperation('validateVin_success', {
      requestId,
      vin,
      reservationId: reservation.id,
      make: data.make,
      model: data.model,
      year: data.year
    });

    return {
      success: true,
      data: {
        make: data.make,
        model: data.model,
        year: data.year,
        valuation: data.price,
        averagePrice: data.averagePrice,
        reservePrice,
        reservationId: reservation.id
      }
    };

  } catch (error) {
    // Enhanced error handling
    logOperation('validateVin_error', { 
      requestId,
      vin, 
      errorMessage: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR',
      stack: error.stack
    }, 'error');
    
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        errorCode: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to validate VIN',
      errorCode: 'SYSTEM_ERROR'
    };
  }
};
