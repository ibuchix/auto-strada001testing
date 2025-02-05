
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValuationRequest {
  operation: 'validate_vin';
  vin: string;
  mileage: number;
  gearbox: string;
}

interface ValidationResponse {
  success: boolean;
  data: {
    make?: string;
    model?: string;
    year?: number;
    vin: string;
    transmission?: string;
    valuation?: number;
    averagePrice?: number;
    isExisting?: boolean;
    noData?: boolean;
    error?: string;
  };
}

function calculateMD5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, vin, mileage, gearbox } = await req.json() as ValuationRequest;
    console.log('Processing seller operation:', { operation, vin, mileage, gearbox });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    switch (operation) {
      case 'validate_vin': {
        console.log('Starting VIN validation for:', vin);

        // Check if VIN exists in cars table
        const { data: existingCar } = await supabase
          .from('cars')
          .select('id, title')
          .eq('vin', vin)
          .eq('is_draft', false)
          .maybeSingle();

        if (existingCar) {
          console.log('Found existing car:', existingCar);
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                vin,
                transmission: gearbox,
                isExisting: true,
                error: 'This vehicle has already been listed'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check VIN search history
        const { data: searchHistory } = await supabase
          .from('vin_search_results')
          .select('search_data')
          .eq('vin', vin)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (searchHistory?.search_data) {
          console.log('Found cached valuation:', searchHistory.search_data);
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                ...searchHistory.search_data,
                transmission: gearbox,
                isExisting: false,
                vin
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prepare API request
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

        const responseData = await response.json();
        console.log('Raw API response:', responseData);

        // Extract required data
        const { make, model, year } = responseData;
        const valuation = responseData.valuation?.calcValuation?.price;
        const averagePrice = responseData.valuation?.calcValuation?.price_avr || valuation;

        if (!make || !model || !year || (!valuation && !averagePrice)) {
          console.log('Missing required data in API response');
          
          // Store the no-data result
          await supabase
            .from('vin_search_results')
            .insert({
              vin,
              search_data: { noData: true, error: 'Could not retrieve complete vehicle information' },
              success: false
            });

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                vin,
                transmission: gearbox,
                noData: true,
                error: 'Could not retrieve complete vehicle information'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const validationData = {
          make,
          model,
          year: parseInt(String(year)),
          vin,
          transmission: gearbox,
          valuation,
          averagePrice,
          isExisting: false
        };

        // Cache the validation result
        await supabase
          .from('vin_search_results')
          .insert({
            vin,
            search_data: validationData,
            success: true
          });

        console.log('Returning validation data:', validationData);
        return new Response(
          JSON.stringify({
            success: true,
            data: validationData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid operation');
    }
  } catch (error) {
    console.error('Error in seller operations:', error);
    return new Response(
      JSON.stringify({
        success: false,
        data: {
          error: error.message || 'Failed to process seller operation'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
