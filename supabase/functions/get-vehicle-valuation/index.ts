import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from "./utils/validation.ts";
import { logOperation } from "./utils/logging.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  const requestId = crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Detailed request logging
    logOperation('request_received', {
      requestId,
      method: req.method,
      contentType: req.headers.get('content-type'),
      url: req.url
    });

    let requestBody;
    try {
      // Explicitly wait for the request body text
      const bodyText = await req.text();
      
      // Log raw request body for debugging
      logOperation('request_body_received', {
        requestId,
        bodyLength: bodyText.length,
        bodyPreview: bodyText.substring(0, 200)
      });

      // Parse JSON only if we have a body
      requestBody = bodyText ? JSON.parse(bodyText) : null;
      
      // Log parsed body
      logOperation('request_body_parsed', {
        requestId,
        parsedBody: requestBody,
        hasVin: Boolean(requestBody?.vin),
        hasMileage: Boolean(requestBody?.mileage),
        hasGearbox: Boolean(requestBody?.gearbox)
      });
    } catch (parseError) {
      logOperation('request_parse_error', {
        requestId,
        error: parseError.message
      }, 'error');

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format. Expected JSON body.',
          code: 'INVALID_REQUEST'
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate the request data
    const validation = validateRequest(requestBody);
    if (!validation.valid) {
      logOperation('validation_failed', {
        requestId,
        error: validation.error,
        requestData: requestBody
      }, 'error');

      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error || 'Invalid request data',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate checksum and make API request
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    const checksumInput = `${apiId}${apiSecret}${requestBody?.vin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(checksumInput);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${requestBody?.vin}/odometer:${requestBody?.mileage}/currency:PLN`;

    console.log({
      timestamp: new Date().toISOString(),
      operation: 'calling_external_api',
      level: 'info',
      requestId,
      vin: requestBody?.vin,
      mileage: String(requestBody?.mileage || 0),
      url: apiUrl
    });

    try {
      const response = await fetch(apiUrl);
      const rawResponseText = await response.text();
      
      console.log({
        timestamp: new Date().toISOString(),
        operation: 'raw_api_response',
        level: 'info',
        requestId,
        responseSize: rawResponseText.length,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        rawResponse: rawResponseText.substring(0, 500) + (rawResponseText.length > 500 ? '...' : '')
      });
      
      // Check for empty or invalid response
      if (!rawResponseText || rawResponseText.trim() === '') {
        throw new Error('Empty response from API');
      }

      // Try to parse the JSON response
      let rawData;
      try {
        rawData = JSON.parse(rawResponseText);
      } catch (parseError) {
        console.log({
          timestamp: new Date().toISOString(),
          operation: 'json_parse_error',
          level: 'error',
          requestId,
          error: parseError.message,
          rawResponse: rawResponseText.substring(0, 200)
        });
        throw new Error('Invalid JSON response from API');
      }
      
      // Check for API error response
      if (rawData.error) {
        console.log({
          timestamp: new Date().toISOString(),
          operation: 'api_returned_error',
          level: 'error',
          requestId,
          apiError: rawData.error
        });
        throw new Error(`API Error: ${rawData.error}`);
      }
      
      // CRITICAL FIX: Direct access to the nested API data structure
      const functionResponse = rawData.functionResponse;
      
      if (!functionResponse) {
        console.log({
          timestamp: new Date().toISOString(),
          operation: 'missing_function_response',
          level: 'error',
          requestId,
          availableKeys: Object.keys(rawData)
        });
        throw new Error('Invalid API response structure: missing functionResponse');
      }
      
      // Extract user parameters and vehicle details
      const userParams = functionResponse.userParams;
      
      if (!userParams) {
        console.log({
          timestamp: new Date().toISOString(),
          operation: 'missing_user_params',
          level: 'error',
          requestId,
          availableKeys: Object.keys(functionResponse)
        });
        throw new Error('Invalid API response structure: missing userParams');
      }
      
      // Log each component to better trace the issue
      console.log({
        timestamp: new Date().toISOString(),
        operation: 'user_params_extracted',
        level: 'info',
        requestId,
        make: userParams.make,
        model: userParams.model,
        year: userParams.year,
        hasMake: !!userParams.make,
        hasModel: !!userParams.model
      });
      
      // Extract valuation data - be more tolerant of partial data
      const valuation = functionResponse.valuation || {};
      let calcValuation = valuation.calcValuation || {};
      
      if (Object.keys(calcValuation).length === 0) {
        console.log({
          timestamp: new Date().toISOString(),
          operation: 'missing_calc_valuation',
          level: 'warn',
          requestId,
          valuationKeys: Object.keys(valuation)
        });
        
        // Try to use alternate data sources
        if (rawData.price || rawData.price_min || rawData.price_med) {
          console.log({
            timestamp: new Date().toISOString(),
            operation: 'using_fallback_pricing',
            level: 'info',
            requestId
          });
          
          calcValuation = {
            price: rawData.price || 0,
            price_min: rawData.price_min || 0,
            price_max: rawData.price_max || 0,
            price_avr: rawData.price_avr || 0,
            price_med: rawData.price_med || 0
          };
        }
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
      
      // If we don't have price data but have vehicle info, use default pricing
      const hasVehicleInfo = !!userParams.make && !!userParams.model;
      const hasPricingData = priceMin > 0 || priceMed > 0 || price > 0;
      
      let basePrice;
      if (hasPricingData) {
        // Calculate base price as the average of min and median price
        basePrice = (priceMin + priceMed) / 2;
        if (basePrice <= 0 && price > 0) {
          basePrice = price;
        }
      } else if (hasVehicleInfo) {
        // If we have vehicle info but no pricing, use a default value
        // This prevents errors and allows the user to continue with manual pricing
        basePrice = 25000; // Default placeholder value
        console.log({
          timestamp: new Date().toISOString(),
          operation: 'using_default_price',
          level: 'warn',
          requestId,
          make: userParams.make,
          model: userParams.model,
          defaultPrice: basePrice
        });
      } else {
        // No data at all - throw error
        throw new Error('No vehicle or pricing data available for this VIN');
      }
      
      console.log({
        timestamp: new Date().toISOString(),
        operation: 'price_calculation',
        level: 'info',
        requestId,
        priceMin,
        priceMed,
        basePrice,
        isUsingFallback: !hasPricingData
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
        mileage: Number(requestBody?.mileage),
        transmission: gearbox,
        valuation: Math.round(basePrice),
        reservePrice: Math.round(reservePrice),
        averagePrice: Math.round(priceMed || basePrice),
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
        result: {
          make: result.make,
          model: result.model,
          year: result.year,
          valuation: result.valuation,
          reservePrice: result.reservePrice
        }
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          data: result
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (apiError) {
      console.error('API request error:', apiError);
      return new Response(
        JSON.stringify({
          success: false,
          error: apiError.message || 'Failed to get valuation from external API',
          code: 'API_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    logOperation('unhandled_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred',
        code: 'SERVER_ERROR'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
