
/**
 * Edge function for vehicle valuation
 * Updated: 2025-04-26 - Completely refactored to directly return raw API values
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
    const rawResponse = await response.text();
    console.log(`Raw API response received, size: ${rawResponse.length}, requestId: ${requestId}`);
    
    try {
      // Parse the raw response
      const apiData = JSON.parse(rawResponse);
      
      // Check for API-level error
      if (apiData.apiStatus !== "OK") {
        console.error(`API status not OK: ${apiData.apiStatus}, requestId: ${requestId}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: `API returned status: ${apiData.apiStatus}`,
            vin,
            mileage: Number(mileage) || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Extract data directly from the API response
      const userParams = apiData.functionResponse?.userParams || {};
      const calcValuation = apiData.functionResponse?.valuation?.calcValuation || {};
      
      if (!userParams.make || !userParams.model) {
        console.error(`Missing make/model in API response, requestId: ${requestId}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Incomplete vehicle data returned',
            vin,
            mileage: Number(mileage) || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!calcValuation.price_min || !calcValuation.price_med) {
        console.error(`Missing price data in API response, requestId: ${requestId}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No pricing data returned',
            make: userParams.make,
            model: userParams.model,
            year: parseInt(userParams.year) || 0,
            vin,
            mileage: Number(mileage) || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Calculate base price (average of min and med)
      const priceMin = parseFloat(calcValuation.price_min);
      const priceMed = parseFloat(calcValuation.price_med);
      const basePrice = (priceMin + priceMed) / 2;
      
      // Calculate reserve price according to pricing tiers
      let reservePercentage = 0.25; // Default
      
      if (basePrice <= 15000) reservePercentage = 0.65;
      else if (basePrice <= 20000) reservePercentage = 0.46;
      else if (basePrice <= 30000) reservePercentage = 0.37;
      else if (basePrice <= 50000) reservePercentage = 0.27;
      else if (basePrice <= 60000) reservePercentage = 0.27;
      else if (basePrice <= 70000) reservePercentage = 0.22;
      else if (basePrice <= 80000) reservePercentage = 0.23;
      else if (basePrice <= 100000) reservePercentage = 0.24;
      else if (basePrice <= 130000) reservePercentage = 0.20;
      else if (basePrice <= 160000) reservePercentage = 0.185;
      else if (basePrice <= 200000) reservePercentage = 0.22;
      else if (basePrice <= 250000) reservePercentage = 0.17;
      else if (basePrice <= 300000) reservePercentage = 0.18;
      else if (basePrice <= 400000) reservePercentage = 0.18;
      else if (basePrice <= 500000) reservePercentage = 0.16;
      else reservePercentage = 0.145;
      
      const reservePrice = basePrice - (basePrice * reservePercentage);
      
      // Create a direct response with minimal transformation
      const result = {
        vin,
        make: userParams.make,
        model: userParams.model,
        year: parseInt(userParams.year) || 0,
        mileage: Number(mileage) || 0,
        transmission: gearbox || userParams.gearbox || "manual",
        valuation: Math.round(basePrice),
        reservePrice: Math.round(reservePrice),
        averagePrice: Math.round(priceMed),
        basePrice: Math.round(basePrice),
      };
      
      console.log(`Processed data prepared, requestId: ${requestId}`);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error(`Failed to parse API response: ${parseError.message}, requestId: ${requestId}`);
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
  } catch (error) {
    console.error(`Error in valuation function: ${error.message}`);
    
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
