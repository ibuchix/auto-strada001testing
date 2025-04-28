
/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-05-01 - Fixed request parsing and validation errors
 */
import { corsHeaders } from './utils/cors.ts';
import { validateRequest, isValidVin, isValidMileage } from './utils/validation.ts';
import md5 from "https://cdn.skypack.dev/md5@2.3.0";

const API_ID = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
const API_SECRET = Deno.env.get('CAR_API_SECRET') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

Deno.serve(async (req) => {
  console.log({
    timestamp: new Date().toISOString(),
    operation: 'request_received',
    level: 'info'
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Log the raw request for debugging
    console.log('[get-vehicle-valuation] Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    // Parse the request body
    let requestData;
    try {
      const requestText = await req.text();
      console.log('[get-vehicle-valuation] Raw request body:', requestText);
      
      // Handle empty request body
      if (!requestText || requestText.trim() === '') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Empty request body',
            code: 'EMPTY_REQUEST'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      requestData = JSON.parse(requestText);
    } catch (e) {
      console.error('[get-vehicle-valuation] JSON parse error:', e);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: e.message
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Log parsed request data with full details for debugging
    console.log('[get-vehicle-valuation] Parsed request data:', 
      JSON.stringify(requestData, null, 2)
    );

    // Basic validation for request structure
    if (!requestData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request body is required',
          code: 'INVALID_REQUEST'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Enhanced VIN validation with clear error message
    if (!('vin' in requestData) || !requestData.vin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VIN parameter is missing or empty',
          code: 'MISSING_VIN'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Mileage validation
    if (!('mileage' in requestData)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Mileage parameter is missing',
          code: 'MISSING_MILEAGE'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Extract and validate parameters
    const vin = String(requestData.vin).trim();
    
    // Convert mileage to number and validate
    let mileage;
    if (typeof requestData.mileage === 'string') {
      mileage = parseInt(requestData.mileage, 10);
    } else {
      mileage = Number(requestData.mileage);
    }
    
    if (isNaN(mileage) || mileage < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid mileage value. Must be a positive number.',
          code: 'INVALID_MILEAGE'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    const gearbox = requestData.gearbox || 'manual';
    
    console.log('[get-vehicle-valuation] Validated parameters:', {
      vin,
      mileage,
      gearbox
    });

    // Calculate checksum
    const checksumContent = API_ID + API_SECRET + vin;
    const checksum = md5(checksumContent);

    // Build API URL
    const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    console.log(`[get-vehicle-valuation] Calling external API for VIN ${vin}`);
    
    // Make request to external API
    const apiResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Auto-Strada-Proxy/1.0'
      }
    });
    
    // Log API response status for debugging
    console.log(`[get-vehicle-valuation] API responded with status: ${apiResponse.status}`);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[get-vehicle-valuation] API Error:`, {
        status: apiResponse.status,
        body: errorText
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `External API returned error: ${apiResponse.status} ${apiResponse.statusText}`,
          details: errorText
        }),
        { 
          status: 502, // Bad Gateway - to indicate a problem with the upstream server
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Get response data
    const apiData = await apiResponse.json();
    console.log(`[get-vehicle-valuation] Successfully processed API response`);
    
    // Process the response
    return new Response(
      JSON.stringify({
        success: true,
        data: apiData,
        source: 'edge-function'
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('[get-vehicle-valuation] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred',
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
