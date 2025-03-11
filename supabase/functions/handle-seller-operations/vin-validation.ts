
/**
 * Changes made:
 * - 2024-06-22: Extracted VIN validation functionality from operations.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { calculateChecksum } from './utils.ts';

export const validateVin = async (
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  mileage: number,
  gearbox: string,
  userId: string
) => {
  console.log(`Validating VIN: ${vin} for user: ${userId}`);

  try {
    // Check if vehicle already exists
    const { data: existingVehicle } = await supabase
      .from('cars')
      .select('id')
      .eq('vin', vin)
      .single();

    if (existingVehicle) {
      console.log('Vehicle already exists in database');
      return {
        success: true,
        data: {
          isExisting: true,
          error: 'This vehicle has already been listed'
        }
      };
    }

    // Get valuation from external API
    const checksum = await calculateChecksum(vin);
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:AUTOSTRA/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    console.log('Fetching valuation data from:', valuationUrl);
    
    const response = await fetch(valuationUrl);
    const data = await response.json();

    if (!data.success) {
      console.error('Valuation API error:', data);
      throw new Error(data.message || 'Failed to get valuation');
    }

    // Calculate base price (average of min and median prices from API)
    const priceMin = data.price_min || data.price;
    const priceMed = data.price_med || data.price;
    const basePrice = (priceMin + priceMed) / 2;
    
    // Use the database function to calculate reserve price
    const { data: reservePriceResult, error: reservePriceError } = await supabase
      .rpc('calculate_reserve_price', { p_base_price: basePrice });
      
    if (reservePriceError) {
      console.error('Error calculating reserve price:', reservePriceError);
      throw new Error('Failed to calculate reserve price');
    }
    
    const reservePrice = reservePriceResult || 0;
    console.log('Calculated reserve price:', reservePrice);

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
      console.error('Reservation error:', reservationError);
      throw reservationError;
    }

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
    console.error('VIN validation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate VIN'
    };
  }
};
