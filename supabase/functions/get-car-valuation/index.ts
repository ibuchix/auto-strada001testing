import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateChecksum } from "./utils/checksum.ts";

const API_ID = 'AUTOSTRA';
const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

serve(async (req) => {
  console.log('Request received:', new Date().toISOString());
  
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
    
    // Input validation
    if (!vin || typeof vin !== 'string' || vin.length < 11) {
      throw new Error('Invalid VIN format');
    }

    if (!mileage || isNaN(mileage) || mileage < 0) {
      throw new Error('Invalid mileage value');
    }

    console.log('Processing VIN valuation request:', {
      vin,
      mileage,
      gearbox,
      timestamp: new Date().toISOString()
    });

    const checksum = calculateChecksum(API_ID, API_SECRET, vin);
    console.log('Calculated checksum:', checksum);

    // First API call to get vehicle details
    const detailsUrl = `https://bp.autoiso.pl/api/v3/getVinDetails/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}`;
    console.log('Calling vehicle details API:', detailsUrl);

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    console.log('Vehicle details API response:', detailsData);

    // Second API call to get valuation
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox || 'manual'}/currency:PLN`;
    console.log('Calling valuation API:', valuationUrl);

    const valuationResponse = await fetch(valuationUrl);
    const valuationData = await valuationResponse.json();
    console.log('Valuation API response:', valuationData);

    // Combine and transform the data
    const combinedData = {
      make: detailsData?.make || valuationData?.make || 'Unknown',
      model: detailsData?.model || valuationData?.model || 'Unknown',
      year: detailsData?.year || valuationData?.year || new Date().getFullYear(),
      vin: vin,
      mileage: mileage,
      transmission: gearbox || 'manual',
      valuation: valuationData?.price || valuationData?.valuation?.price || null,
      averagePrice: valuationData?.average_price || valuationData?.market_value || null,
      currency: "PLN"
    };

    console.log('Final transformed data:', combinedData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valuation completed successfully',
        data: combinedData
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
        error: error.message,
        timestamp: new Date().toISOString(),
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