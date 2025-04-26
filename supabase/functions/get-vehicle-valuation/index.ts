
/**
 * Changes made:
 * - 2025-04-26: Improved data extraction from nested API response
 * - 2025-04-26: Added detailed logging and validation
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

    let rawData;
    try {
      rawData = JSON.parse(rawResponseText);
    } catch (error) {
      console.error('Failed to parse API response:', error);
      throw new Error('Invalid API response format');
    }

    // Extract data from nested structure
    const userParams = rawData?.functionResponse?.userParams;
    const calcValuation = rawData?.functionResponse?.valuation?.calcValuation;

    if (!userParams || !calcValuation) {
      console.error('Missing required data in API response');
      throw new Error('Incomplete valuation data');
    }

    console.log({
      timestamp: new Date().toISOString(),
      operation: 'extracted_data',
      level: 'info',
      requestId,
      userParams,
      calcValuation
    });

    // Extract pricing data
    const priceMin = Number(calcValuation.price_min) || 0;
    const priceMed = Number(calcValuation.price_med) || 0;
    const basePrice = (priceMin + priceMed) / 2;

    console.log({
      timestamp: new Date().toISOString(),
      operation: 'price_calculation',
      level: 'info',
      requestId,
      priceMin,
      priceMed,
      basePrice
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

    // Prepare the final response
    const result = {
      success: true,
      data: {
        vin,
        make: userParams.make || '',
        model: userParams.model || '',
        year: userParams.year || new Date().getFullYear(),
        mileage: Number(mileage) || 0,
        transmission: gearbox,
        price: Math.round(calcValuation.price) || 0,
        valuation: Math.round(basePrice) || 0,
        reservePrice: Math.round(reservePrice) || 0,
        averagePrice: Math.round(priceMed) || 0,
        basePrice: Math.round(basePrice) || 0,
        // Include raw data for debugging
        rawApiResponse: rawResponseText
      }
    };

    console.log({
      timestamp: new Date().toISOString(),
      operation: 'final_response',
      level: 'info',
      requestId,
      response: result
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
