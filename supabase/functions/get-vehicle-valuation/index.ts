
/**
 * Edge function for vehicle valuation
 * Updated: 2025-04-26 - Completely refactored to directly return raw API values
 * Updated: 2025-04-28 - Fixed data extraction from raw API response
 * Updated: 2025-04-30 - Fixed JSON parsing and direct data extraction
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
    console.log(`Raw API response received, requestId: ${requestId}`);
    
    // Parse the raw response
    let rawData;
    try {
      rawData = JSON.parse(rawResponseText);
      console.log(`Raw API response parsed, requestId: ${requestId}`);
    } catch (parseError) {
      console.error(`Failed to parse API response as JSON: ${parseError}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse API response',
          vin,
          mileage: Number(mileage) || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log the raw API response (limited size for debugging)
    const responseSize = rawResponseText.length;
    console.log({
      timestamp: new Date().toISOString(),
      operation: "raw_api_response",
      level: "info",
      requestId,
      responseSize,
      rawResponse: rawResponseText
    });
    
    // Extract valuation data from the response
    try {
      // Check if we have the expected data structure
      if (!rawData.functionResponse) {
        console.error(`Missing functionResponse in API data, requestId: ${requestId}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid API response structure',
            vin,
            mileage: Number(mileage) || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Extract user parameters
      const userParams = rawData.functionResponse.userParams;
      if (!userParams) {
        console.error(`Missing userParams in API data, requestId: ${requestId}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing vehicle parameters in API response',
            vin,
            mileage: Number(mileage) || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Extract price data
      let priceMin = 0;
      let priceMed = 0;
      let basePrice = 0;
      
      // Look for price data in calcValuation
      if (rawData.functionResponse.valuation?.calcValuation) {
        const calcValuation = rawData.functionResponse.valuation.calcValuation;
        priceMin = Number(calcValuation.price_min) || 0;
        priceMed = Number(calcValuation.price_med) || 0;
        
        // Log found price fields
        console.log({
          timestamp: new Date().toISOString(),
          operation: "price_fields_found",
          level: "info",
          requestId,
          priceFields: {
            price: calcValuation.price,
            price_min: calcValuation.price_min,
            price_max: calcValuation.price_max,
            price_avr: calcValuation.price_avr,
            price_med: calcValuation.price_med
          }
        });
      } else {
        // Log no price fields found
        console.log({
          timestamp: new Date().toISOString(),
          operation: "price_fields_found",
          level: "info",
          requestId,
          priceFields: {},
          allFields: Object.keys(rawData)
        });
      }
      
      // Calculate base price (average of min and median)
      if (priceMin > 0 && priceMed > 0) {
        basePrice = (priceMin + priceMed) / 2;
      }
      
      // Log price calculation
      console.log({
        timestamp: new Date().toISOString(),
        operation: "price_calculation",
        level: "info",
        requestId,
        priceMin,
        priceMed,
        basePrice,
        isUsingFallback: false
      });
      
      // Calculate reserve price
      const reservePrice = calculateReservePrice(basePrice);
      
      // Log reserve price calculation
      console.log({
        timestamp: new Date().toISOString(),
        operation: "reserve_price_calculated",
        level: "info",
        requestId,
        basePrice,
        percentage: basePrice <= 15000 ? 0.65 : 0.46, // simplified for logging
        reservePrice,
        formula: `${basePrice} - (${basePrice} × ${basePrice <= 15000 ? 0.65 : 0.46})`
      });
      
      // Create the final result object
      const result = {
        make: userParams.make || '',
        model: userParams.model || '',
        year: userParams.year || new Date().getFullYear(),
        valuation: Math.round(basePrice),
        reservePrice: Math.round(reservePrice), 
        basePrice: Math.round(basePrice),
        averagePrice: Math.round(priceMed),
        price_min: Math.round(priceMin),
        price_med: Math.round(priceMed),
        vin,
        originalRequestParams: { vin, mileage, gearbox },
        rawApiResponse: rawResponseText
      };

      // Log the final result
      console.log({
        timestamp: new Date().toISOString(),
        operation: "final_result",
        level: "info",
        requestId,
        result: {
          vin,
          make: result.make,
          model: result.model,
          year: result.year,
          mileage,
          price: basePrice,
          valuation: basePrice,
          reservePrice: reservePrice,
          averagePrice: priceMed
        }
      });
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (extractError) {
      console.error(`Error extracting data: ${extractError}, requestId: ${requestId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error extracting vehicle data',
          rawApiResponse: rawResponseText,
          vin,
          mileage: Number(mileage) || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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
  
  // Calculate the reserve price: PriceX - (PriceX × PercentageY)
  return Math.round(basePrice - (basePrice * percentage));
}
