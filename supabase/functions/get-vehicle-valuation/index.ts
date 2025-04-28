import { corsHeaders } from './utils/cors.ts';
import md5 from "https://cdn.skypack.dev/md5@2.3.0";

const API_ID = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
const API_SECRET = Deno.env.get('CAR_API_SECRET') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

Deno.serve(async (req) => {
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
    });

    // Parse the request body
    const requestText = await req.text();
    console.log('[get-vehicle-valuation] Raw request body:', requestText);

    let requestData;
    try {
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

    // Log parsed request data
    console.log('[get-vehicle-valuation] Parsed request data:', requestData);

    // Validate required parameters
    const { vin, mileage, gearbox = 'manual' } = requestData;

    if (!vin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: vin',
          receivedParams: { vin, mileage, gearbox }
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

    if (mileage === undefined || mileage === null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: mileage',
          receivedParams: { vin, mileage, gearbox }
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

    // Validate mileage is a positive number
    const numericMileage = Number(mileage);
    if (isNaN(numericMileage) || numericMileage < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid mileage value. Must be a positive number.',
          receivedValue: mileage
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

    // Calculate checksum
    const checksumContent = API_ID + API_SECRET + vin;
    const checksum = md5(checksumContent);

    console.log('[get-vehicle-valuation] Making API request for:', {
      vin,
      mileage: numericMileage,
      gearbox
    });

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
    
    // Get response data
    const apiData = await apiResponse.json();
    
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
        details: error.message
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
