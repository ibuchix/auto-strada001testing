
/**
 * Changes made:
 * - 2025-04-26: Improved data extraction from nested API response
 * - 2025-04-26: Fixed direct parsing of nested API data structures
 * - 2025-04-26: Added extensive logging for troubleshooting
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const { vin, mileage, gearbox = 'manual' } = await req.json();
    
    console.log({
      timestamp: new Date().toISOString(),
      operation: 'valuation_request_received',
      level: 'info',
      requestId,
      vin,
      mileage,
      gearbox
    });

    // Calculate checksum and make API request
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    const checksumInput = `${apiId}${apiSecret}${vin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(checksumInput);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

    console.log({
      timestamp: new Date().toISOString(),
      operation: 'calling_external_api',
      level: 'info',
      requestId,
      vin,
      mileage,
      url: apiUrl
    });

    const response = await fetch(apiUrl);
    const rawResponseText = await response.text();
    
    console.log({
      timestamp: new Date().toISOString(),
      operation: 'raw_api_response',
      level: 'info',
      requestId,
      responseSize: rawResponseText.length,
      rawResponse: rawResponseText
    });

    // Parse the raw response and extract the necessary data
    try {
      const rawData = JSON.parse(rawResponseText);
      
      // CRITICAL FIX: Direct access to the nested API data structure
      const functionResponse = rawData.functionResponse;
      
      if (!functionResponse) {
        throw new Error('Invalid API response structure: missing functionResponse');
      }
      
      // Extract user parameters and vehicle details
      const userParams = functionResponse.userParams;
      
      if (!userParams) {
        throw new Error('Invalid API response structure: missing userParams');
      }
      
      // Extract valuation data
      const valuation = functionResponse.valuation;
      const calcValuation = valuation?.calcValuation;
      
      if (!calcValuation) {
        throw new Error('Invalid API response structure: missing calcValuation');
      }
      
      console.log({
        timestamp: new Date().toISOString(),
        operation: 'extracted_data',
        level: 'info',
        requestId,
        userParams: JSON.stringify(userParams),
        calcValuation: JSON.stringify(calcValuation)
      });
      
      // Extract price data from calcValuation
      const price = Number(calcValuation.price) || 0;
      const priceMin = Number(calcValuation.price_min) || 0;
      const priceMax = Number(calcValuation.price_max) || 0;
      const priceAvr = Number(calcValuation.price_avr) || 0;
      const priceMed = Number(calcValuation.price_med) || 0;
      
      // Calculate base price as the average of min and median price
      const basePrice = (priceMin + priceMed) / 2;
      
      console.log({
        timestamp: new Date().toISOString(),
        operation: 'price_calculation',
        level: 'info',
        requestId,
        priceMin,
        priceMed,
        basePrice,
        isUsingFallback: false
      });
      
      // Calculate reserve price based on base price
      let percentage = 0.65; // Default percentage for prices <= 15,000
      if (basePrice > 500000) percentage = 0.145;
      else if (basePrice > 400000) percentage = 0.16;
      else if (basePrice > 300000) percentage = 0.18;
      else if (basePrice > 250000) percentage = 0.18;
      else if (basePrice > 200000) percentage = 0.17;
      else if (basePrice > 160000) percentage = 0.22;
      else if (basePrice > 130000) percentage = 0.185;
      else if (basePrice > 100000) percentage = 0.20;
      else if (basePrice > 80000) percentage = 0.24;
      else if (basePrice > 70000) percentage = 0.23;
      else if (basePrice > 60000) percentage = 0.22;
      else if (basePrice > 50000) percentage = 0.27;
      else if (basePrice > 30000) percentage = 0.27;
      else if (basePrice > 20000) percentage = 0.37;
      else if (basePrice > 15000) percentage = 0.46;
      
      const reservePrice = basePrice - (basePrice * percentage);
      
      console.log({
        timestamp: new Date().toISOString(),
        operation: 'reserve_price_calculated',
        level: 'info',
        requestId,
        basePrice,
        percentage,
        reservePrice,
        formula: `${basePrice} - (${basePrice} × ${percentage})`
      });
      
      // Format result with properly extracted data
      const result = {
        vin,
        make: userParams.make || '',
        model: userParams.model || '',
        year: userParams.year ? Number(userParams.year) : new Date().getFullYear(),
        mileage: Number(mileage),
        transmission: gearbox,
        valuation: Math.round(basePrice),
        reservePrice: Math.round(reservePrice),
        averagePrice: Math.round(priceMed),
        basePrice: Math.round(basePrice),
        // Include price details for debugging
        price_details: {
          price,
          price_min: priceMin,
          price_max: priceMax,
          price_avr: priceAvr,
          price_med: priceMed
        },
        // Include original API response for debugging
        rawApiResponse: rawResponseText
      };
      
      console.log({
        timestamp: new Date().toISOString(),
        operation: 'final_result',
        level: 'info',
        requestId,
        result
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          data: result
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error(`Invalid API response format: ${parseError.message}`);
    }

  } catch (error) {
    console.error('Error in valuation function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to get valuation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
