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
    isExisting?: boolean;
    noData?: boolean;
    error?: string;
  };
}

interface PricingDetails {
  originalMinPrice: number;
  originalMaxPrice: number;
  originalAveragePrice: number;
  calculatedBasePrice: number;
  calculatedReservePrice: number;
  discountPercentage: number;
  mileage: number;
  timestamp: string;
}

function calculateMD5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function calculatePrices(minValue: number, maxValue: number): { basePrice: number; reservePrice: number; discountPercentage: number } {
  console.log(`Calculating prices for min: ${minValue}, max: ${maxValue}`);

  // Calculate base price (PriceX) as average of min and max
  const basePrice = (minValue + maxValue) / 2;
  console.log(`Base price (PriceX): ${basePrice}`);

  // Determine percentage based on price range
  let discountPercentage = 0;
  if (basePrice <= 15000) discountPercentage = 0.65;
  else if (basePrice <= 20000) discountPercentage = 0.46;
  else if (basePrice <= 30000) discountPercentage = 0.37;
  else if (basePrice <= 50000) discountPercentage = 0.27;
  else if (basePrice <= 60000) discountPercentage = 0.27;
  else if (basePrice <= 70000) discountPercentage = 0.22;
  else if (basePrice <= 80000) discountPercentage = 0.23;
  else if (basePrice <= 100000) discountPercentage = 0.24;
  else if (basePrice <= 130000) discountPercentage = 0.20;
  else if (basePrice <= 160000) discountPercentage = 0.185;
  else if (basePrice <= 200000) discountPercentage = 0.22;
  else if (basePrice <= 250000) discountPercentage = 0.17;
  else if (basePrice <= 300000) discountPercentage = 0.18;
  else if (basePrice <= 400000) discountPercentage = 0.18;
  else if (basePrice <= 500000) discountPercentage = 0.16;
  else discountPercentage = 0.145;

  console.log(`Applied discount percentage: ${discountPercentage * 100}%`);

  // Calculate reserve price
  const reservePrice = basePrice - (basePrice * discountPercentage);
  console.log(`Calculated reserve price: ${reservePrice}`);

  return {
    basePrice: Math.round(basePrice),
    reservePrice: Math.round(reservePrice),
    discountPercentage
  };
}

function validateApiResponse(responseData: any): boolean {
  console.log('Validating API response:', responseData);
  
  // Check if we have a valid response
  if (!responseData || typeof responseData !== 'object') {
    console.log('Invalid response structure');
    return false;
  }

  // Check API status
  if (responseData.apiStatus === 'ND') {
    console.log('API returned No Data status');
    return false;
  }

  // Check if we have valid vehicle data
  const hasUserParams = responseData?.functionResponse?.userParams && 
                       responseData.functionResponse.userParams.make && 
                       responseData.functionResponse.userParams.model && 
                       responseData.functionResponse.userParams.year;

  // Check if we have valid price information
  const hasValuation = responseData?.functionResponse?.valuation?.calcValuation?.price;

  console.log('Has user params:', hasUserParams);
  console.log('Has valuation:', hasValuation);

  return hasUserParams && hasValuation;
}

async function makeApiRequest(url: string, retries = 3, delay = 2000): Promise<Response> {
  console.log(`Making API request to ${url} (retries left: ${retries})`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (error.name === 'AbortError') {
        console.log('Request timed out');
        throw new Error('Request timed out after 30 seconds');
      }

      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      // Increase delay for next retry (exponential backoff)
      delay *= 2;
    }
  }

  throw new Error('All retry attempts failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting new valuation request');
  const startTime = Date.now();

  try {
    const { vin, mileage = 50000, gearbox = 'manual', context = 'home' } = await req.json() as ValuationRequest;
    console.log('Processing request:', { vin, mileage, gearbox, context });

    if (!vin) {
      throw new Error('VIN number is required');
    }

    if (typeof mileage !== 'number' || mileage < 0 || mileage > 1000000) {
      throw new Error('Invalid mileage value');
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

    // Prepare API request
    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    if (!apiSecret) {
      throw new Error('API secret not configured');
    }

    const cleanVin = vin.trim().toUpperCase();
    const checksum = calculateMD5(`${apiId}${apiSecret}${cleanVin}`);
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${cleanVin}/odometer:${mileage}/currency:PLN`;

    try {
      const response = await makeApiRequest(apiUrl);
      const responseData = await response.json();
      console.log('Raw API response:', JSON.stringify(responseData, null, 2));

      // Validate the response
      if (!validateApiResponse(responseData)) {
        console.log('Response validation failed');
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              vin: cleanVin,
              transmission: gearbox,
              noData: true,
              error: 'Could not retrieve complete vehicle information. Please verify the VIN number.'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get data from functionResponse
      const data = responseData.functionResponse.userParams;
      const valuationData = responseData.functionResponse.valuation;

      // Calculate prices using our formula
      const { basePrice, reservePrice, discountPercentage } = calculatePrices(
        valuationData.calcValuation.price_min || valuationData.calcValuation.price,
        valuationData.calcValuation.price_max || valuationData.calcValuation.price
      );

      // Log pricing details to database
      const pricingDetails: PricingDetails = {
        originalMinPrice: valuationData.calcValuation.price_min || valuationData.calcValuation.price,
        originalMaxPrice: valuationData.calcValuation.price_max || valuationData.calcValuation.price,
        originalAveragePrice: valuationData.calcValuation.price_avr,
        calculatedBasePrice: basePrice,
        calculatedReservePrice: reservePrice,
        discountPercentage,
        mileage,
        timestamp: new Date().toISOString()
      };

      // Store pricing details in database
      const { error: logError } = await supabase
        .from('valuation_logs')
        .insert({
          vin: cleanVin,
          pricing_details: pricingDetails,
          raw_api_response: responseData
        });

      if (logError) {
        console.error('Failed to log pricing details:', logError);
      }

      // Return only our calculated price to frontend
      const result: ValuationResponse = {
        success: true,
        data: {
          make: String(data.make),
          model: String(data.model),
          year: parseInt(String(data.year)),
          vin: cleanVin,
          transmission: gearbox,
          valuation: basePrice,
        }
      };

      console.log('Processed response:', JSON.stringify(result, null, 2));
      console.log(`Request completed in ${Date.now() - startTime}ms`);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('API request error:', error);
      throw new Error(`Failed to get vehicle data: ${error.message}`);
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
