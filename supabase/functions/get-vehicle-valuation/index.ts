
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface ValuationResponse {
  version: string;
  vin: string;
  apiStatus: string;
  functionResponse: {
    userParams: {
      make: string;
      model: string;
      year: number;
      capacity: string;
      fuel: string;
    };
    valuation: {
      calcValuation: {
        price: number;
        price_min: number;
        price_max: number;
        price_avr: number;
        price_med: number;
      };
    };
  };
}

async function generateMd5(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check cache before making external API call
async function checkCache(supabase: any, vin: string, mileage: number): Promise<any> {
  console.log('Checking cache for VIN:', vin);
  
  const { data, error } = await supabase
    .from('vin_valuation_cache')
    .select('*')
    .eq('vin', vin)
    // Only get cache entries where the mileage is within 5% of the requested mileage
    .gte('mileage', mileage * 0.95)
    .lte('mileage', mileage * 1.05)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error('Error checking cache:', error);
    return null;
  }
  
  if (data && data.length > 0) {
    const cachedEntry = data[0];
    
    // Check if cache is valid (30 days)
    const cacheDate = new Date(cachedEntry.created_at);
    const now = new Date();
    const daysDifference = (now.getTime() - cacheDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDifference <= 30) {
      console.log('Valid cache found for VIN:', vin);
      return cachedEntry.valuation_data;
    }
    
    console.log('Cache expired for VIN:', vin);
  }
  
  return null;
}

// Store valuation data in cache
async function storeInCache(supabase: any, vin: string, mileage: number, valuationData: any): Promise<void> {
  try {
    console.log('Storing valuation in cache for VIN:', vin);
    
    const { error } = await supabase
      .from('vin_valuation_cache')
      .insert([
        {
          vin,
          mileage,
          valuation_data: valuationData
        }
      ]);
      
    if (error) {
      console.error('Error storing in cache:', error);
    }
  } catch (error) {
    console.error('Failed to store in cache:', error);
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting valuation request processing`);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox } = await req.json();
    console.log(`[${requestId}] Processing valuation request for VIN: ${vin}, Mileage: ${mileage}, Gearbox: ${gearbox}`);

    // Input validation
    if (!vin || !mileage) {
      console.error(`[${requestId}] Missing required parameters: VIN or mileage`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: VIN and mileage are required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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
    
    // Check cache first
    const cachedData = await checkCache(supabase, vin, mileage);
    
    if (cachedData) {
      console.log(`[${requestId}] Returning cached valuation for VIN: ${vin}`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...cachedData,
            vin,
            transmission: gearbox,
            cached: true,
            reservePrice: cachedData.valuation || cachedData.reservePrice
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No cache hit, proceed with API call
    console.log(`[${requestId}] No cache found, fetching from external API`);
    
    // Calculate checksum for API request using proper MD5 hashing
    const API_ID = 'AUTOSTRA';
    const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    const input = `${API_ID}${API_SECRET}${vin}`;
    const checksum = await generateMd5(input);
    
    console.log(`[${requestId}] Generated checksum: ${checksum}`);

    // Make request to external valuation API
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    console.log(`[${requestId}] Requesting valuation from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });
    
    if (!response.ok) {
      console.error(`[${requestId}] API response error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `External API returned ${response.status}: ${response.statusText}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }
    
    const apiData: ValuationResponse = await response.json();
    console.log(`[${requestId}] API Response received:`, JSON.stringify(apiData).substring(0, 200) + '...');

    // Check if we have valid valuation data
    if (!apiData.functionResponse?.valuation?.calcValuation) {
      console.error(`[${requestId}] Invalid or missing valuation data in API response`);
      return new Response(
        JSON.stringify({
          success: false,
          data: {
            vin,
            transmission: gearbox,
            error: 'No pricing data available for this vehicle'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract price data
    const calc = apiData.functionResponse.valuation.calcValuation;
    const priceMin = calc.price_min || calc.price || 0;
    const priceMed = calc.price_med || calc.price || 0;
    
    // Calculate base price (average of min and median)
    const basePrice = (priceMin + priceMed) / 2;
    console.log(`[${requestId}] Base price (PriceX): ${basePrice}`);

    // Use the database function to calculate reserve price
    const { data: reservePrice, error: reservePriceError } = await supabase
      .rpc('calculate_reserve_price', { p_base_price: basePrice });
      
    if (reservePriceError) {
      console.error(`[${requestId}] Error calculating reserve price:`, reservePriceError);
      
      // Calculate reserve price manually as fallback
      let percentage = 0;
      if (basePrice <= 15000) percentage = 0.65;
      else if (basePrice <= 20000) percentage = 0.46;
      else if (basePrice <= 30000) percentage = 0.37;
      else if (basePrice <= 50000) percentage = 0.27;
      else if (basePrice <= 60000) percentage = 0.27;
      else if (basePrice <= 70000) percentage = 0.22;
      else if (basePrice <= 80000) percentage = 0.23;
      else if (basePrice <= 100000) percentage = 0.24;
      else if (basePrice <= 130000) percentage = 0.20;
      else if (basePrice <= 160000) percentage = 0.185;
      else if (basePrice <= 200000) percentage = 0.22;
      else if (basePrice <= 250000) percentage = 0.17;
      else if (basePrice <= 300000) percentage = 0.18;
      else if (basePrice <= 400000) percentage = 0.18;
      else if (basePrice <= 500000) percentage = 0.16;
      else percentage = 0.145; // 500,001+ PLN
      
      const calculatedReserve = Math.round(basePrice - (basePrice * percentage));
      console.log(`[${requestId}] Calculated reserve price manually: ${calculatedReserve}`);
      
      // Prepare valuation data for cache and response with manually calculated reserve
      const valuationData = {
        make: apiData.functionResponse.userParams.make,
        model: apiData.functionResponse.userParams.model,
        year: apiData.functionResponse.userParams.year,
        vin,
        transmission: gearbox,
        valuation: calculatedReserve,
        reservePrice: calculatedReserve,
        basePrice: basePrice,
        averagePrice: basePrice
      };
      
      // Store in cache for future requests
      await storeInCache(supabase, vin, mileage, valuationData);
      
      console.log(`[${requestId}] Returning valuation with manually calculated reserve price`);
      return new Response(
        JSON.stringify({
          success: true,
          data: valuationData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${requestId}] Calculated reserve price from DB function: ${reservePrice}`);
    
    // Prepare valuation data for cache and response
    const valuationData = {
      make: apiData.functionResponse.userParams.make,
      model: apiData.functionResponse.userParams.model,
      year: apiData.functionResponse.userParams.year,
      vin,
      transmission: gearbox,
      valuation: reservePrice,
      reservePrice: reservePrice,
      basePrice: basePrice,
      averagePrice: basePrice
    };
    
    // Store in cache for future requests
    await storeInCache(supabase, vin, mileage, valuationData);

    console.log(`[${requestId}] Returning complete valuation data`);
    return new Response(
      JSON.stringify({
        success: true,
        data: valuationData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] Error processing valuation:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
