
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox } = await req.json();
    console.log('Processing valuation request for VIN:', vin, 'Mileage:', mileage);

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
      console.log('Returning cached valuation for VIN:', vin);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...cachedData,
            vin,
            transmission: gearbox,
            cached: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No cache hit, proceed with API call
    console.log('No cache found, fetching from external API');
    
    // Calculate checksum for API request using proper MD5 hashing
    const API_ID = 'AUTOSTRA';
    const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    const input = `${API_ID}${API_SECRET}${vin}`;
    const checksum = await generateMd5(input);
    
    console.log('Generated checksum:', checksum);

    // Make request to external valuation API
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    console.log('Requesting valuation from:', apiUrl);
    
    const response = await fetch(apiUrl);
    const apiData: ValuationResponse = await response.json();
    
    console.log('API Response:', apiData);

    // Check if we have valid valuation data
    if (!apiData.functionResponse?.valuation?.calcValuation?.price_min || 
        !apiData.functionResponse?.valuation?.calcValuation?.price_med) {
      console.log('No price data available for VIN:', vin);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            vin,
            transmission: gearbox,
            noData: true,
            error: 'No pricing data available for this vehicle'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract price data
    const priceMin = apiData.functionResponse.valuation.calcValuation.price_min;
    const priceMed = apiData.functionResponse.valuation.calcValuation.price_med;
    
    // Calculate base price (average of min and median)
    const basePrice = (priceMin + priceMed) / 2;
    console.log('Base price (PriceX):', basePrice);

    // Use the database function to calculate reserve price
    const { data: reservePrice, error: reservePriceError } = await supabase
      .rpc('calculate_reserve_price', { p_base_price: basePrice });
      
    if (reservePriceError) {
      console.error('Error calculating reserve price:', reservePriceError);
      throw new Error('Failed to calculate reserve price');
    }
    
    console.log('Calculated reserve price from DB function:', reservePrice);
    
    // Prepare valuation data for cache and response
    const valuationData = {
      make: apiData.functionResponse.userParams.make,
      model: apiData.functionResponse.userParams.model,
      year: apiData.functionResponse.userParams.year,
      vin,
      transmission: gearbox,
      valuation: reservePrice,
      averagePrice: basePrice
    };
    
    // Store in cache for future requests
    storeInCache(supabase, vin, mileage, valuationData);

    return new Response(
      JSON.stringify({
        success: true,
        data: valuationData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing valuation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
