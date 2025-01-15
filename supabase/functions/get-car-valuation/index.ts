import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateChecksum } from "./utils/checksum.ts";

const API_ID = Deno.env.get('CAR_API_ID');
const API_SECRET = Deno.env.get('CAR_API_SECRET');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API credentials first
    if (!API_ID || !API_SECRET) {
      console.error('Missing API credentials:', { API_ID_exists: !!API_ID, API_SECRET_exists: !!API_SECRET });
      throw new Error('API configuration is incomplete. Please check the environment variables.');
    }

    const { vin, mileage, gearbox } = await req.json();
    console.log('Processing VIN valuation request:', { vin, mileage, gearbox });

    if (!vin || !mileage) {
      throw new Error('VIN and mileage are required');
    }

    // Calculate checksum using the provided API credentials
    const checksum = calculateChecksum(API_ID, API_SECRET, vin);
    console.log('Calculated checksum:', checksum);

    // Construct the API URL with all required parameters
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox || 'manual'}/currency:PLN`;
    console.log('Calling API:', apiUrl);

    const response = await fetch(apiUrl);
    const responseData = await response.json();
    console.log('API Response:', responseData);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    // Extract and transform the valuation data
    const valuationData = {
      make: responseData.make || responseData.functionResponse?.make,
      model: responseData.model || responseData.functionResponse?.model,
      year: responseData.year || responseData.functionResponse?.year,
      vin: vin,
      mileage: mileage,
      transmission: gearbox || 'manual',
      valuation: responseData.price || responseData.valuation?.price || responseData.estimated_value || responseData.value,
      currency: "PLN"
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valuation completed successfully',
        data: valuationData
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to get valuation',
        data: null
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});