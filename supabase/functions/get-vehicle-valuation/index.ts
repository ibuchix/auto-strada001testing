
// get-vehicle-valuation/index.ts
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
    // Parse the request body
    const requestData = await req.json();
    const { vin, mileage, gearbox } = requestData;
    
    // Validate required parameters
    if (!vin || !mileage) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: vin and mileage are required' 
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
    // Handle errors
    console.error(`[get-vehicle-valuation] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred',
        errorCode: error.code || 'UNKNOWN_ERROR'
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
