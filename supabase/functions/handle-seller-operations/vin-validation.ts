
/**
 * Changes made:
 * - 2024-06-22: Extracted VIN validation functionality from operations.ts
 * - 2024-07-07: Added better error handling, rate limiting, and enhanced logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { calculateChecksum, checkRateLimit, logOperation, ValidationError, withRetry } from './utils.ts';

export const validateVin = async (
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  mileage: number,
  gearbox: string,
  userId: string
) => {
  logOperation('validateVin_start', { vin, mileage, gearbox, userId: userId });

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

    // Check if vehicle already exists
    const { data: existingVehicle, error: existingVehicleError } = await supabase
      .from('cars')
      .select('id')
      .eq('vin', vin)
      .single();

    if (existingVehicleError && existingVehicleError.code !== 'PGRST116') {
      logOperation('existing_vehicle_check_error', { 
        vin, 
        error: existingVehicleError.message 
      }, 'error');
      throw new ValidationError(
        'Error checking existing vehicle', 
        'DATABASE_ERROR'
      );
    }

    if (existingVehicle) {
      logOperation('vehicle_already_exists', { vin, vehicleId: existingVehicle.id });
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
    
    logOperation('fetching_valuation', { vin, url: valuationUrl });
    
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
      logOperation('valuation_api_error', { vin, apiResponse: data }, 'error');
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
    logOperation('calculated_reserve_price', { vin, basePrice, reservePrice });

    // Create a reservation for this VIN
    const { data: reservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .insert([
        {
          vin,
          user_id: userId,
          status: 'pending',
          valuation_data: {
            ...data,
            reservePrice,
            basePrice
          }
        }
      ])
      .select()
      .single();

    if (reservationError) {
      logOperation('reservation_creation_error', { 
        vin, 
        error: reservationError.message 
      }, 'error');
      throw reservationError;
    }

    logOperation('validateVin_success', {
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
