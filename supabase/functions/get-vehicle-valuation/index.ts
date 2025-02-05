
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: 'manual' | 'automatic';
  context?: 'home' | 'seller';
}

interface ValuationResponse {
  success: boolean;
  data: {
    make?: string;
    model?: string;
    year?: number;
    vin: string;
    transmission: string;
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

function validateApiResponse(responseData: any): boolean {
  console.log('Validating API response:', responseData);
  
  // Validate basic structure
  if (!responseData || typeof responseData !== 'object') {
    console.log('Invalid response structure');
    return false;
  }

  // Check if we have all required fields
  const hasBasicFields = !!(
    responseData.make &&
    responseData.model &&
    responseData.year
  );

  console.log('Has basic fields:', hasBasicFields);

  // Check if we have either direct price or nested price
  const hasPrice = !!(
    responseData.price ||
    responseData.valuation ||
    (responseData.functionResponse?.valuation?.calcValuation?.price) ||
    (responseData.functionResponse?.price)
  );

  console.log('Has price:', hasPrice);

  if (!hasBasicFields || !hasPrice) {
    console.log('Missing required fields in API response');
    return false;
  }

  return true;
}

function extractPrice(responseData: any): number | undefined {
  // Try different possible price paths
  const price = 
    responseData.price ||
    responseData.valuation ||
    responseData.functionResponse?.valuation?.calcValuation?.price ||
    responseData.functionResponse?.price;

  if (typeof price === 'number') {
    console.log('Extracted price:', price);
    return price;
  }

  console.log('No valid price found');
  return undefined;
}

function extractAveragePrice(responseData: any): number | undefined {
  // Try different possible average price paths
  const avgPrice = 
    responseData.averagePrice ||
    responseData.price_avr ||
    responseData.functionResponse?.valuation?.calcValuation?.price_avr;

  if (typeof avgPrice === 'number') {
    console.log('Extracted average price:', avgPrice);
    return avgPrice;
  }

  console.log('No valid average price found');
  return undefined;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage = 50000, gearbox = 'manual', context = 'home' } = await req.json() as ValuationRequest;
    console.log('Processing request:', { vin, mileage, gearbox, context });

    if (!vin) {
      throw new Error('VIN number is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    // Check if VIN exists (only for seller context)
    if (context === 'seller') {
      console.log('Checking VIN existence for seller context');
      const { data: exists } = await supabase.rpc('check_vin_exists', { check_vin: vin });
      
      if (exists) {
        console.log('VIN already exists in database');
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              vin,
              transmission: gearbox,
              isExisting: true,
              error: "This vehicle has already been listed"
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare API request
    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    if (!apiSecret) {
      throw new Error('API secret not configured');
    }

    const cleanVin = vin.trim().toUpperCase();
    const checksum = calculateMD5(`${apiId}${apiSecret}${cleanVin}`);
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${cleanVin}/odometer:${mileage}/currency:PLN`;

    console.log('Making API request to:', apiUrl);

    // Make API request with increased timeout (4 minutes)
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log('Request timed out after 4 minutes');
      controller.abort();
    }, 240000);

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
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Raw API response:', JSON.stringify(responseData, null, 2));

      // Validate response data
      if (!validateApiResponse(responseData)) {
        console.log('Response validation failed');
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              vin: cleanVin,
              transmission: gearbox,
              noData: true
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract and validate price
      const price = extractPrice(responseData);
      const averagePrice = extractAveragePrice(responseData) || price;

      if (!price && !averagePrice) {
        console.log('No valid price found in response');
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              vin: cleanVin,
              transmission: gearbox,
              noData: true
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return processed data
      const result: ValuationResponse = {
        success: true,
        data: {
          make: String(responseData.make),
          model: String(responseData.model),
          year: parseInt(String(responseData.year)),
          vin: cleanVin,
          transmission: gearbox,
          valuation: price,
          averagePrice: averagePrice
        }
      };

      console.log('Processed response:', JSON.stringify(result, null, 2));

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out');
        throw new Error('Request timed out after 4 minutes');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        data: {
          error: error.message || 'Failed to get vehicle valuation'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
