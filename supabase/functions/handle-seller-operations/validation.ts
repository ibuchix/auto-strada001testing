
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ValidationResponse } from './types.ts';
import { calculateMD5 } from './utils.ts';
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
  const apiId = 'AUTOSTRA';
  const apiSecret = Deno.env.get('CAR_API_SECRET');
  if (!apiSecret) {
    throw new Error('API secret not configured');
  }

  const checksum = calculateMD5(`${apiId}${apiSecret}${vin}`);
  const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

  console.log('Making API request to:', apiUrl);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed with status: ${response.status}`);
  }

  return await response.json();
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
