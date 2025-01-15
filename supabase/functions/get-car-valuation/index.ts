import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateChecksum } from "./utils/checksum.ts";

const API_ID = 'AUTOSTRA';
const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

serve(async (req) => {
  console.log('Received request:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Parsed request body:', parsedBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { vin, mileage, gearbox } = parsedBody;
    console.log('Processing VIN valuation request:', { vin, mileage, gearbox });

    if (!vin || !mileage) {
      throw new Error('VIN and mileage are required');
    }

    // Calculate checksum using the hardcoded API credentials
    const checksum = calculateChecksum(API_ID, API_SECRET, vin);
    console.log('Calculated checksum:', checksum);

    // Construct the API URL with all required parameters
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox || 'manual'}/currency:PLN`;
    console.log('Calling API:', apiUrl);

    const response = await fetch(apiUrl);
    console.log('API Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed API Response:', responseData);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error('Invalid JSON response from API');
    }

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

    console.log('Transformed valuation data:', valuationData);

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