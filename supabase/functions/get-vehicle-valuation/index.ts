
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: 'manual' | 'automatic';
  context?: 'home' | 'seller';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculateMD5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  console.log('Valuation request received:', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage = 50000, gearbox = 'manual', context = 'home' } = await req.json() as ValuationRequest;
    console.log('Request parameters:', { vin, mileage, gearbox, context });

    if (!vin) {
      throw new Error('VIN number is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: { 'x-request-timeout': '240000' }
      }
    });

    // Check if VIN exists only for seller context
    if (context === 'seller') {
      const { data: exists, error: checkError } = await supabase.rpc('check_vin_exists', {
        check_vin: vin
      });

      if (checkError) {
        console.error('Error checking VIN:', checkError);
        throw new Error("Failed to check VIN status");
      }

      if (exists) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              isExisting: true,
              error: "This vehicle has already been listed"
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    
    if (!apiSecret) {
      console.error('Configuration error: Missing API secret');
      throw new Error('CAR_API_SECRET environment variable is not set');
    }

    // Clean and prepare input string
    const cleanVin = vin.trim().toUpperCase();
    const input = `${apiId}${apiSecret}${cleanVin}`;
    const checksum = calculateMD5(input);

    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${cleanVin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
    
    console.log('Making request to API:', apiUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 404) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                vin: cleanVin,
                transmission: gearbox,
                noData: true,
                error: 'No data found for this VIN'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error(`External API request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('API Response:', JSON.stringify(responseData, null, 2));

      // Check if we have valid data and proper structure
      if (responseData.apiStatus !== 'OK' || 
          !responseData.functionResponse?.userParams?.make || 
          !responseData.functionResponse?.userParams?.model || 
          !responseData.functionResponse?.valuation?.calcValuation?.price) {
        console.log('Invalid or incomplete data in response');
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              vin: cleanVin,
              transmission: gearbox,
              noData: true,
              error: 'No data found for this VIN'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract only the required data, avoiding nested structures
      const valuationResult = {
        make: String(responseData.functionResponse.userParams.make),
        model: String(responseData.functionResponse.userParams.model),
        year: parseInt(responseData.functionResponse.userParams.year),
        vin: cleanVin,
        transmission: gearbox,
        fuelType: String(responseData.functionResponse.userParams.fuel),
        valuation: parseInt(responseData.functionResponse.valuation.calcValuation.price),
        averagePrice: parseInt(responseData.functionResponse.valuation.calcValuation.price_avr || 
                     responseData.functionResponse.valuation.calcValuation.price),
        capacity: parseFloat(responseData.functionResponse.userParams.capacity),
        isExisting: false
      };

      console.log('Constructed valuation result:', valuationResult);

      // Return only the processed data
      return new Response(
        JSON.stringify({
          success: true,
          data: valuationResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        throw new Error('External API request timed out');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in Edge Function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
