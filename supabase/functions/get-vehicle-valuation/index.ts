import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: 'manual' | 'automatic';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculateMD5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  console.log('Valuation request received:', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage = 50000, gearbox = 'manual' } = await req.json() as ValuationRequest;
    console.log('Request parameters:', { vin, mileage, gearbox });

    if (!vin) {
      throw new Error('VIN number is required');
    }

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    
    if (!apiSecret) {
      console.error('Configuration error: Missing API secret');
      throw new Error('CAR_API_SECRET environment variable is not set');
    }

    console.log('API Configuration:', { apiId, hasSecret: !!apiSecret });

    // Clean and prepare input string
    const cleanVin = vin.trim().toUpperCase();
    const input = `${apiId}${apiSecret}${cleanVin}`;
    const checksum = calculateMD5(input);

    console.log('Request preparation:', {
      cleanVin,
      checksumLength: checksum.length,
      inputLength: input.length
    });

    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${cleanVin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
    
    console.log('Making request to API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      // Return a 200 status with noData flag if the API returns a 404
      if (response.status === 404) {
        return new Response(
          JSON.stringify({
            success: true,
            noData: true,
            message: 'No data found for this VIN'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            },
            status: 200
          }
        );
      }
      
      throw new Error(`External API request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('API Response:', JSON.stringify(responseData, null, 2));

    if (responseData.apiStatus !== 'OK' || !responseData.functionResponse) {
      return new Response(
        JSON.stringify({
          success: true,
          noData: true,
          message: 'No data found for this VIN'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 200
        }
      );
    }

    // Extract the average price from the calcValuation object
    const averagePrice = responseData.functionResponse?.valuation?.calcValuation?.price_avr || 
                        responseData.functionResponse?.valuation?.calcValuation?.price || 
                        0;

    console.log('Extracted average price:', averagePrice);

    const valuationResult = {
      make: responseData.functionResponse?.userParams?.make || 'Not available',
      model: responseData.functionResponse?.userParams?.model || 'Not available',
      year: responseData.functionResponse?.userParams?.year || null,
      vin: cleanVin,
      transmission: gearbox,
      fuelType: responseData.functionResponse?.userParams?.fuel || 'Not available',
      valuation: responseData.functionResponse?.valuation?.calcValuation?.price || 0,
      averagePrice: averagePrice,
      rawResponse: responseData
    };

    console.log('Transformed valuation result:', valuationResult);

    return new Response(
      JSON.stringify({
        success: true,
        data: valuationResult,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in Edge Function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        noData: true,
        message: error.message || 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200  // Always return 200 to handle in the frontend
      }
    );
  }
});