import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_ID = 'AUTOSTRA';
const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

async function calculateChecksum(vin: string): Promise<string> {
  const input = `${API_ID}${API_SECRET}${vin}`;
  console.log('Calculating checksum for input:', input);
  
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Calculate MD5 hash
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Calculated checksum:', checksum);
  return checksum;
}

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
    
    if (!vin || typeof vin !== 'string' || vin.length < 11) {
      throw new Error('Invalid VIN format');
    }

    if (!mileage || isNaN(mileage) || mileage < 0) {
      throw new Error('Invalid mileage value');
    }

    console.log('Processing request for:', { vin, mileage, gearbox });

    // Calculate checksum
    const checksum = await calculateChecksum(vin);
    console.log('Using checksum for API requests:', checksum);

    // First API call - Get vehicle details
    const detailsUrl = `https://bp.autoiso.pl/api/v3/getVinDetails/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}`;
    console.log('Calling vehicle details API:', detailsUrl);

    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoStra-API-Client/1.0'
      }
    });

    if (!detailsResponse.ok) {
      throw new Error(`Vehicle details API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Vehicle details API response:', detailsData);

    // Second API call - Get valuation
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox || 'manual'}/currency:PLN`;
    console.log('Calling valuation API:', valuationUrl);

    const valuationResponse = await fetch(valuationUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoStra-API-Client/1.0'
      }
    });

    if (!valuationResponse.ok) {
      throw new Error(`Valuation API error: ${valuationResponse.status}`);
    }

    const valuationData = await valuationResponse.json();
    console.log('Valuation API response:', valuationData);

    // Extract and validate the vehicle details
    const make = detailsData?.make || valuationData?.make || detailsData?.vehicle?.make;
    const model = detailsData?.model || valuationData?.model || detailsData?.vehicle?.model;
    const year = detailsData?.year || valuationData?.year || detailsData?.vehicle?.year;
    const price = valuationData?.price || valuationData?.valuation?.price || valuationData?.market_value;
    const marketValue = valuationData?.market_value || valuationData?.average_price || price;

    // If we don't have basic vehicle details, try to extract from response data
    const vehicleInfo = detailsData?.vehicle || detailsData?.data || {};
    const extractedMake = vehicleInfo.make || vehicleInfo.manufacturer;
    const extractedModel = vehicleInfo.model || vehicleInfo.type;

    // Combine the data
    const combinedData = {
      make: make || extractedMake || 'Unknown',
      model: model || extractedModel || 'Unknown',
      year: year || new Date().getFullYear(),
      vin,
      transmission: gearbox || 'manual',
      valuation: price,
      averagePrice: marketValue,
      currency: "PLN",
      mileage,
      isExisting: !!(make || extractedMake || model || extractedModel),
      rawDetails: detailsData,
      rawValuation: valuationData
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