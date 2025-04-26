
/**
 * Edge function for vehicle valuation
 * Updated: 2025-04-26 - Completely refactored to directly return raw API values
 * Updated: 2025-04-28 - Fixed data extraction from raw API response
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";

serve(async (req) => {
  // Handle CORS if needed
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID().substring(0, 8);
    
    // Parse request data
    const requestJson = await req.json();
    const { vin, mileage, gearbox = 'manual' } = requestJson;
    
    console.log(`Valuation request received for VIN: ${vin}, mileage: ${mileage}, requestId: ${requestId}`);
    
    if (!vin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing VIN parameter',
          vin: '',
          mileage: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get API credentials
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    
    if (!apiSecret) {
      console.error(`Missing API credentials, requestId: ${requestId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API credentials not configured',
          vin,
          mileage: Number(mileage) || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate checksum for the API request
    const checksum = await calculateChecksum(apiId, apiSecret, vin);
    
    // Build API URL
    const apiURL = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    console.log(`Calling external API: ${apiURL}, requestId: ${requestId}`);
    
    // Call the external API
    const response = await fetch(apiURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Autostrada-Seller/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`API returned error: ${response.status}, requestId: ${requestId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `API error: ${response.statusText}`,
          vin,
          mileage: Number(mileage) || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the raw response
    const rawResponseText = await response.text();
    let rawResponse;
    
    try {
      rawResponse = JSON.parse(rawResponseText);
      console.log(`Raw API response received and parsed, requestId: ${requestId}`);
    } catch (parseError) {
      console.error('Failed to parse raw API response:', parseError);
      // Return raw text if JSON parsing fails
      rawResponse = rawResponseText;
    }

    // Extract the actual data we need from the response
    const extractedData = extractValuationData(rawResponse, vin, Number(mileage), gearbox, requestId);
    
    // Return both the extracted data and raw API response
    return new Response(
      JSON.stringify({
        rawApiResponse: rawResponse,
        ...extractedData,
        originalRequestParams: { vin, mileage, gearbox }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in valuation function:', error);
    
    // Try to extract vin and mileage from the request
    let vin = '';
    let mileage = 0;
    try {
      const requestBody = await req.clone().json();
      vin = requestBody.vin || '';
      mileage = Number(requestBody.mileage) || 0;
    } catch (e) {
      // Couldn't extract data from request
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        vin,
        mileage
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Helper function to calculate MD5 checksum
async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  const stringToHash = apiId + apiSecret + vin;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  
  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to extract and transform the valuation data
function extractValuationData(rawResponse: any, vin: string, mileage: number, gearbox: string, requestId: string) {
  try {
    // Check if we have the expected structure
    if (!rawResponse || !rawResponse.functionResponse) {
      console.log(`Incomplete API response structure, requestId: ${requestId}`);
      return { 
        make: '',
        model: '',
        year: new Date().getFullYear(),
        valuation: 0,
        reservePrice: 0,
        averagePrice: 0
      };
    }
    
    // Extract user params
    const userParams = rawResponse.functionResponse.userParams;
    
    // Extract calculated valuation data
    const calcValuation = rawResponse.functionResponse.valuation?.calcValuation;
    
    if (!userParams || !calcValuation) {
      console.log(`Missing critical valuation data, requestId: ${requestId}`);
      return {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        valuation: 0,
        reservePrice: 0,
        averagePrice: 0
      };
    }
    
    // Extract base data
    const make = userParams.make || '';
    const model = userParams.model || '';
    const year = userParams.year || new Date().getFullYear();
    
    // Extract pricing data
    const priceMin = calcValuation.price_min || 0;
    const priceMed = calcValuation.price_med || 0;
    const price = calcValuation.price || 0;
    
    // Calculate base price (average of min and median)
    const basePrice = (priceMin + priceMed) / 2;
    
    // Calculate reserve price based on the pricing tiers
    const reservePrice = calculateReservePrice(basePrice);
    
    console.log(`Extracted data: make=${make}, model=${model}, year=${year}, basePrice=${basePrice}, reservePrice=${reservePrice}, requestId: ${requestId}`);
    
    return {
      make,
      model, 
      year,
      valuation: price || basePrice,
      basePrice,
      reservePrice,
      averagePrice: priceMed,
      price_min: priceMin,
      price_med: priceMed
    };
  } catch (error) {
    console.error(`Error extracting valuation data: ${error.message}, requestId: ${requestId}`);
    return { 
      make: '',
      model: '',
      year: new Date().getFullYear(),
      valuation: 0,
      reservePrice: 0,
      averagePrice: 0,
      error: 'Failed to extract valuation data'
    };
  }
}

// Calculate reserve price based on basePrice tiers
function calculateReservePrice(basePrice: number): number {
  if (!basePrice || basePrice <= 0) return 0;
  
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Log the calculation for debugging
  const formula = `${basePrice} - (${basePrice} × ${percentage})`;
  const result = Math.round(basePrice - (basePrice * percentage));
  console.log(`Price calculation: basePrice=${basePrice}, percentage=${percentage}, formula="${formula}", result=${result}`);
  
  return result;
}
