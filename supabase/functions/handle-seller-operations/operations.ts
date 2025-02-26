/**
 * Changes made:
 * - 2024-03-19: Added reserve price calculation logic
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';

const calculateReservePrice = (averagePrice: number): number => {
  // Start with 85% of the average price as the reserve
  const reservePercentage = 0.85;
  const baseReserve = averagePrice * reservePercentage;
  
  // Round to nearest 100
  return Math.round(baseReserve / 100) * 100;
};

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

    // Calculate reserve price from the average price
    const averagePrice = data.price || data.averagePrice;
    const reservePrice = calculateReservePrice(averagePrice);

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
            reservePrice
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

const calculateChecksum = async (vin: string): Promise<string> => {
  const secretKey = 'RUhBVklOR1JPT1RTRU5TT1JFUw==';

  const encoder = new TextEncoder();
  const key = encoder.encode(secretKey);
  const data = encoder.encode(vin);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    data
  );

  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
};
