import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const API_ID = 'AUTOSTRA';
const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

async function calculateChecksum(vin: string): Promise<string> {
  const input = `${API_ID}${API_SECRET}${vin}`;
  console.log('Calculating checksum for input:', input);
  
  const hash = createHash('md5');
  hash.update(input);
  const checksum = hash.toString();
  
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

    let detailsResponse;
    try {
      detailsResponse = await fetch(detailsUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AutoStra-API-Client/1.0'
        }
      });
      console.log('Details API Response Status:', detailsResponse.status);
      
      const detailsText = await detailsResponse.text();
      console.log('Raw Details API Response:', detailsText);
      
      try {
        detailsResponse = { ok: detailsResponse.ok, json: JSON.parse(detailsText) };
      } catch (e) {
        console.error('Failed to parse details response:', e);
        throw new Error('Invalid JSON in details response');
      }
    } catch (error) {
      console.error('Failed to fetch vehicle details:', error);
      throw new Error('Failed to connect to vehicle details API');
    }

    if (!detailsResponse.ok) {
      console.error('Vehicle details API error:', {
        status: detailsResponse.status,
        response: detailsResponse.json
      });
      throw new Error(`Vehicle details API error: ${detailsResponse.status}`);
    }

    const detailsData = detailsResponse.json;
    console.log('Vehicle details API response:', detailsData);

    // Second API call - Get valuation
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox || 'manual'}/currency:PLN`;
    console.log('Calling valuation API:', valuationUrl);

    let valuationResponse;
    try {
      valuationResponse = await fetch(valuationUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AutoStra-API-Client/1.0'
        }
      });
      console.log('Valuation API Response Status:', valuationResponse.status);
      
      const valuationText = await valuationResponse.text();
      console.log('Raw Valuation API Response:', valuationText);
      
      try {
        valuationResponse = { ok: valuationResponse.ok, json: JSON.parse(valuationText) };
      } catch (e) {
        console.error('Failed to parse valuation response:', e);
        throw new Error('Invalid JSON in valuation response');
      }
    } catch (error) {
      console.error('Failed to fetch valuation:', error);
      throw new Error('Failed to connect to valuation API');
    }

    if (!valuationResponse.ok) {
      console.error('Valuation API error:', {
        status: valuationResponse.status,
        response: valuationResponse.json
      });
      throw new Error(`Valuation API error: ${valuationResponse.status}`);
    }

    const valuationData = valuationResponse.json;
    console.log('Valuation API response:', valuationData);

    // Extract and validate the vehicle details
    const make = detailsData?.make || valuationData?.make || 'Unknown';
    const model = detailsData?.model || valuationData?.model || 'Unknown';
    const year = detailsData?.year || valuationData?.year || new Date().getFullYear();
    const price = valuationData?.price || valuationData?.valuation?.price || null;
    const marketValue = valuationData?.market_value || valuationData?.average_price || null;

    // Combine the data
    const combinedData = {
      make,
      model,
      year,
      vin,
      transmission: gearbox || 'manual',
      valuation: price,
      averagePrice: marketValue,
      currency: "PLN",
      mileage,
      isExisting: make !== 'Unknown' || model !== 'Unknown'
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