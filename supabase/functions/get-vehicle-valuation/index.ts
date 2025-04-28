import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from "./utils/validation.ts";
import { logOperation } from "./utils/logging.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// API credentials
const API_ID = Deno.env.get("VALUATION_API_ID") || "";
const API_SECRET = Deno.env.get("VALUATION_API_SECRET") || "";

serve(async (req) => {
  const requestId = crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request received with complete details
    logOperation('request_received', {
      requestId,
      method: req.method,
      url: req.url,
      contentType: req.headers.get('content-type'),
      timestamp: new Date().toISOString()
    });

    // COMPLETELY REFACTORED REQUEST PARSING LOGIC
    let requestData;
    try {
      // Get request body as text first - no assumptions
      const bodyText = await req.text();
      
      // Detailed logging of raw request body
      logOperation('request_body_raw', {
        requestId,
        bodyLength: bodyText.length,
        bodyPreview: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')
      });
      
      // Skip parsing if body is empty
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      // Parse JSON - with detailed error logging
      try {
        requestData = JSON.parse(bodyText);
      } catch (jsonError) {
        logOperation('json_parse_error', {
          requestId, 
          error: jsonError.message,
          bodyText: bodyText.substring(0, 500)
        }, 'error');
        
        throw new Error(`Invalid JSON format: ${jsonError.message}`);
      }
      
      // Log parsed data details for debugging
      logOperation('request_data_parsed', {
        requestId,
        hasData: !!requestData,
        dataKeys: requestData ? Object.keys(requestData) : [],
        vin: requestData?.vin || 'missing',
        mileage: requestData?.mileage || 'missing',
        gearbox: requestData?.gearbox || 'missing'
      });
    } catch (parseError) {
      logOperation('request_parse_fatal_error', {
        requestId,
        error: parseError.message
      }, 'error');

      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid request format: ${parseError.message}`,
          code: 'INVALID_REQUEST'
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Enhanced validation
    if (!requestData) {
      logOperation('validation_failed', {
        requestId,
        error: 'Empty request data'
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request body is empty or invalid',
          code: 'EMPTY_REQUEST'
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize VIN (remove spaces, convert to uppercase)
    if (requestData.vin) {
      requestData.vin = requestData.vin.toString().trim().toUpperCase();
    }

    // Normalize mileage to number
    if (requestData.mileage !== undefined) {
      requestData.mileage = typeof requestData.mileage === 'string' 
        ? parseInt(requestData.mileage, 10) 
        : requestData.mileage;
    }
    
    // Validate the request data with improved validation
    const validation = validateRequest(requestData);
    if (!validation.valid) {
      logOperation('validation_failed', {
        requestId,
        error: validation.error,
        requestData
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
    const checksumInput = `${API_ID}${API_SECRET}${requestData.vin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(checksumInput);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${requestData.vin}/odometer:${requestData.mileage}/currency:PLN`;

    logOperation('calling_external_api', {
      requestId,
      vin: requestData.vin,
      mileage: String(requestData.mileage || 0),
      url: apiUrl
    });

    try {
      const response = await fetch(apiUrl);
      const rawResponseText = await response.text();
      
      logOperation('raw_api_response', {
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
        logOperation('json_parse_error', {
          requestId,
          error: parseError.message,
          rawResponse: rawResponseText.substring(0, 200)
        }, 'error');
        throw new Error('Invalid JSON response from API');
      }
      
      // Check for API error response
      if (rawData.error) {
        logOperation('api_returned_error', {
          requestId,
          apiError: rawData.error
        }, 'error');
        throw new Error(`API Error: ${rawData.error}`);
      }

      // Extract function response
      const functionResponse = rawData.functionResponse;
      
      if (!functionResponse) {
        logOperation('missing_function_response', {
          requestId,
          availableKeys: Object.keys(rawData)
        }, 'error');
        throw new Error('Invalid API response structure: missing functionResponse');
      }
      
      // Extract user parameters and vehicle details
      const userParams = functionResponse.userParams;
      
      if (!userParams) {
        logOperation('missing_user_params', {
          requestId,
          availableKeys: Object.keys(functionResponse)
        }, 'error');
        throw new Error('Invalid API response structure: missing userParams');
      }
      
      // Extract valuation data - be more tolerant of partial data
      const valuation = functionResponse.valuation || {};
      let calcValuation = valuation.calcValuation || {};
      
      if (Object.keys(calcValuation).length === 0) {
        logOperation('missing_calc_valuation', {
          requestId,
          valuationKeys: Object.keys(valuation)
        }, 'warn');
        
        // Try to use alternate data sources
        if (rawData.price || rawData.price_min || rawData.price_med) {
          logOperation('using_fallback_pricing', {
            requestId
          }, 'info');
          
          calcValuation = {
            price: rawData.price || 0,
            price_min: rawData.price_min || 0,
            price_max: rawData.price_max || 0,
            price_avr: rawData.price_avr || 0,
            price_med: rawData.price_med || 0
          };
        }
      }
      
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
        basePrice = 25000; // Default placeholder value
        logOperation('using_default_price', {
          requestId,
          make: userParams.make,
          model: userParams.model,
          defaultPrice: basePrice
        }, 'warn');
      } else {
        // No data at all - throw error
        throw new Error('No vehicle or pricing data available for this VIN');
      }
      
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
      
      // Format result with properly extracted data
      const result = {
        vin: requestData.vin,
        make: userParams.make || '',
        model: userParams.model || '',
        year: userParams.year ? Number(userParams.year) : new Date().getFullYear(),
        mileage: Number(requestData.mileage),
        transmission: requestData.gearbox,
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
        // Include raw API response for debugging
        rawApiResponse: rawResponseText
      };
      
      logOperation('final_result', {
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
        { headers: corsHeaders }
      );
      
    } catch (apiError) {
      logOperation('api_request_error', {
        requestId,
        error: apiError.message,
        stack: apiError.stack
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: apiError.message || 'Failed to get valuation from external API',
          code: 'API_ERROR'
        }),
        { headers: corsHeaders, status: 500 }
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
