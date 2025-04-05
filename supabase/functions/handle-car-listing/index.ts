
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received request to handle-car-listing');
    
    const requestData = await req.json();
    console.log('Request body:', requestData);
    
    const { vin, mileage, gearbox } = requestData as ValuationRequest;
    console.log('Parsed request:', { vin, mileage, gearbox });

    if (!vin || !mileage || !gearbox) {
      console.error('Missing required fields:', { vin, mileage, gearbox });
      throw new Error('Missing required fields: vin, mileage, and gearbox are all required')
    }

    // Get API credentials from environment variables
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiSecret) {
      console.error('Missing API credentials in environment');
      throw new Error('Missing API secret key')
    }

    // Calculate checksum
    const input = `${apiId}${apiSecret}${vin}`
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('MD5', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    console.log('Calculated checksum:', checksum);

    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`
    
    console.log('Calling API:', apiUrl);

    // Set timeout for API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Make API request
      const response = await fetch(apiUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Autostrada/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        const responseText = await response.text();
        console.error('API error response:', responseText);
        throw new Error(`API responded with status: ${response.status} - ${responseText}`);
      }
      
      const valuationData = await response.json();
      
      console.log('Received valuation data:', JSON.stringify(valuationData).substring(0, 200) + '...');
      
      // Check if the API returned valid data
      if (!valuationData) {
        console.error('Empty response from API');
        throw new Error('Empty response from valuation API');
      }
      
      // Check if the API returned an error
      if (valuationData.error) {
        console.error('Error in API response:', valuationData.error);
        throw new Error(valuationData.error || 'Failed to get valuation');
      }
      
      // Verify we have some kind of data
      if (Object.keys(valuationData).length < 3) {
        console.error('Insufficient data in API response:', valuationData);
        throw new Error('Insufficient data returned from valuation API');
      }
    
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials');
        throw new Error('Missing database credentials');
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Store the search result with complete valuation data
      const { error: searchError } = await supabase
        .from('vin_search_results')
        .insert({
          vin,
          search_data: valuationData,
          user_id: req.headers.get('authorization')?.split('Bearer ')[1] || null
        });
      
      if (searchError) {
        console.error('Error storing search result:', searchError);
        // Continue anyway, this is just for analytics
      }
      
      // Extract make, model, year with fallbacks
      const make = valuationData.make || valuationData.manufacturer || null;
      const model = valuationData.model || valuationData.modelName || null;
      const year = valuationData.year || valuationData.productionYear || null;
      
      // Calculate reserve price based on valuation
      let valuation = valuationData.valuation || 
                     valuationData.price_med || 
                     (valuationData.price_min + valuationData.price_max) / 2 || 
                     null;
                     
      if (!valuation && !make && !model) {
        console.error('Critical data missing in API response');
        throw new Error('No vehicle data found for this VIN');
      }
      
      let reservePrice;
      if (valuation) {
        const priceX = valuation;
        let percentageY;
        
        // Determine percentage based on price range
        if (priceX <= 15000) percentageY = 0.65;
        else if (priceX <= 20000) percentageY = 0.46;
        else if (priceX <= 30000) percentageY = 0.37;
        else if (priceX <= 50000) percentageY = 0.27;
        else if (priceX <= 60000) percentageY = 0.27;
        else if (priceX <= 70000) percentageY = 0.22;
        else if (priceX <= 80000) percentageY = 0.23;
        else if (priceX <= 100000) percentageY = 0.24;
        else if (priceX <= 130000) percentageY = 0.20;
        else if (priceX <= 160000) percentageY = 0.185;
        else if (priceX <= 200000) percentageY = 0.22;
        else if (priceX <= 250000) percentageY = 0.17;
        else if (priceX <= 300000) percentageY = 0.18;
        else if (priceX <= 400000) percentageY = 0.18;
        else if (priceX <= 500000) percentageY = 0.16;
        else percentageY = 0.145;
        
        // Apply formula: PriceX – (PriceX x PercentageY)
        reservePrice = Math.round(priceX - (priceX * percentageY));
        console.log('Calculated reserve price:', { priceX, percentageY, reservePrice });
      }
      
      // Return only the fields that match our database schema, plus the reserve price
      const responseData = {
        make: make,
        model: model,
        year: year,
        vin: vin,
        mileage: mileage,
        valuation: valuation,
        reservePrice: reservePrice || valuation,
        averagePrice: valuationData.price_med || valuation,
        transmission: gearbox,
        // Include raw data for diagnostic purposes
        apiData: {
          dataSize: JSON.stringify(valuationData).length,
          fields: Object.keys(valuationData)
        }
      };
      
      console.log('Sending response data:', JSON.stringify(responseData).substring(0, 200) + '...');
      
      return new Response(
        JSON.stringify(responseData),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('API request timeout');
        throw new Error('Valuation API request timed out');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});
