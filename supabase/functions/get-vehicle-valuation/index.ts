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
    const rawResponseText = await response.text();
    let rawResponse;
    
    try {
      rawResponse = JSON.parse(rawResponseText);
    } catch (parseError) {
      console.error('Failed to parse raw API response:', parseError);
      // Return raw text if JSON parsing fails
      rawResponse = rawResponseText;
    }

    // Return the ENTIRE raw API response
    return new Response(
      JSON.stringify({
        rawApiResponse: rawResponse,
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
