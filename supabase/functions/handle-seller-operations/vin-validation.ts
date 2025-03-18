
/**
 * Changes made:
 * - 2024-06-22: Extracted VIN validation functionality from operations.ts
 * - 2024-07-07: Added better error handling, rate limiting, and enhanced logging
 * - 2024-07-15: Added caching for recent VIN validations
 * - 2024-07-18: Enhanced VIN reservation handling for more reliability
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { 
  calculateChecksum, 
  checkRateLimit, 
  logOperation, 
  ValidationError, 
  withRetry,
  getCachedValidation,
  cacheValidation
} from './utils.ts';
import {
  activateReservation,
  validateReservation,
  releaseReservation
} from './reservations.ts';

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
        const { data: reservation, error: reservationError } = await supabase
          .from('vin_reservations')
          .insert([
            {
              vin,
              user_id: userId,
              status: 'pending',
              valuation_data: cachedData
            }
          ])
          .select()
          .single();

        if (reservationError) {
          logOperation('reservation_creation_error', { 
            requestId,
            vin, 
            error: reservationError.message 
          }, 'error');
          throw reservationError;
        }
        
        // Activate the reservation
        await activateReservation(supabase, reservation.id, userId);
        
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
    const { data: existingVehicle, error: existingVehicleError } = await supabase
      .from('cars')
      .select('id')
      .eq('vin', vin)
      .single();

    if (existingVehicleError && existingVehicleError.code !== 'PGRST116') {
      logOperation('existing_vehicle_check_error', { 
        requestId,
        vin, 
        error: existingVehicleError.message 
      }, 'error');
      throw new ValidationError(
        'Error checking existing vehicle', 
        'DATABASE_ERROR'
      );
    }

    if (existingVehicle) {
      logOperation('vehicle_already_exists', { 
        requestId,
        vin, 
        vehicleId: existingVehicle.id 
      });
      
      // Cache this result
      cacheValidation(vin, { isExisting: true }, mileage);
      
      return {
        success: true,
        data: {
          isExisting: true,
          error: 'This vehicle has already been listed'
        }
      };
    }

    // Get valuation from external API with retry mechanism
    const checksum = await calculateChecksum(vin);
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:AUTOSTRA/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('fetching_valuation', { 
      requestId,
      vin, 
      url: valuationUrl 
    });
    
    const data = await withRetry(async () => {
      const response = await fetch(valuationUrl);
      if (!response.ok) {
        throw new ValidationError(
          `API responded with status: ${response.status}`, 
          'API_ERROR'
        );
      }
      return await response.json();
    });

    if (!data.success) {
      logOperation('valuation_api_error', { 
        requestId,
        vin, 
        apiResponse: data 
      }, 'error');
      throw new ValidationError(
        data.message || 'Failed to get valuation', 
        'VALUATION_ERROR'
      );
    }

    // Calculate base price (average of min and median prices from API)
    const priceMin = data.price_min || data.price;
    const priceMed = data.price_med || data.price;
    const basePrice = (priceMin + priceMed) / 2;
    
    // Use the database function to calculate reserve price
    const { data: reservePriceResult, error: reservePriceError } = await supabase
      .rpc('calculate_reserve_price', { p_base_price: basePrice });
      
    if (reservePriceError) {
      logOperation('reserve_price_calculation_error', { 
        requestId,
        vin, 
        basePrice, 
        error: reservePriceError.message 
      }, 'error');
      throw new ValidationError(
        'Failed to calculate reserve price', 
        'RESERVE_PRICE_ERROR'
      );
    }
    
    const reservePrice = reservePriceResult || 0;
    logOperation('calculated_reserve_price', { 
      requestId,
      vin, 
      basePrice, 
      reservePrice 
    });
    
    // Add the reserve price to the data for caching
    const valuationData = {
      ...data,
      reservePrice,
      basePrice
    };
    
    // Cache the valuation data
    cacheValidation(vin, valuationData, mileage);

    // Create a reservation for this VIN
    const { data: reservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .insert([
        {
          vin,
          user_id: userId,
          status: 'pending',
          valuation_data: valuationData
        }
      ])
      .select()
      .single();

    if (reservationError) {
      logOperation('reservation_creation_error', { 
        requestId,
        vin, 
        error: reservationError.message 
      }, 'error');
      throw reservationError;
    }
    
    // Activate the reservation after creation
    await activateReservation(supabase, reservation.id, userId);

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
