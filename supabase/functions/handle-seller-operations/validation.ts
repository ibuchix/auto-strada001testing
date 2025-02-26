
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHash } from 'https://deno.land/std@0.202.0/hash/mod.ts';
import { ValidationResponse } from './types.ts';
import { corsHeaders } from './utils.ts';

export async function validateVehicleHistory(supabase: SupabaseClient, vin: string) {
  const { data: existingCar } = await supabase
    .from('cars')
    .select('id, title')
    .eq('vin', vin)
    .eq('is_draft', false)
    .maybeSingle();

  return existingCar;
}

export async function checkVinSearchHistory(supabase: SupabaseClient, vin: string) {
  const { data: searchHistory } = await supabase
    .from('vin_search_results')
    .select('search_data')
    .eq('vin', vin)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return searchHistory;
}

export async function fetchVehicleData(vin: string, mileage: number) {
  const API_ID = 'AUTOSTRA';
  const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
  
  // Calculate checksum using md5
  const checksum = createHash('md5')
    .update(API_ID + API_SECRET + vin)
    .toString();
  
  console.log('Calculated checksum:', checksum);
  console.log('Making API request for VIN:', vin, 'with mileage:', mileage);
  
  const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
  
  console.log('Requesting from URL:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    throw error;
  }
}

export function createErrorResponse(vin: string, gearbox: string, error: string): ValidationResponse {
  return {
    success: false,
    data: {
      vin,
      transmission: gearbox,
      error
    }
  };
}

export function createSuccessResponse(data: any): ValidationResponse {
  return {
    success: true,
    data
  };
}
