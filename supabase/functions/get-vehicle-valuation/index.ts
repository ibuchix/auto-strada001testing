import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.177.0/hash/mod.ts";

interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: 'manual' | 'automatic';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  // Clean and concatenate inputs
  const cleanApiId = apiId.trim();
  const cleanApiSecret = apiSecret.trim();
  const cleanVin = vin.trim().toUpperCase();
  
  // Create input string
  const input = `${cleanApiId}${cleanApiSecret}${cleanVin}`;
  console.log('Input string length:', input.length);
  
  // Create MD5 hash using Deno's createHash
  const hash = createHash('md5');
  hash.update(input);
  const checksum = hash.toString('hex');
  
  // Validate against test case
  const testVin = 'WAUZZZ8K79A090954';
  const testInput = `${cleanApiId}${cleanApiSecret}${testVin}`;
  const testHash = createHash('md5');
  testHash.update(testInput);
  const testChecksum = testHash.toString('hex');
  
  console.log('Test case validation:', {
    testVin,
    expectedChecksum: '6c6f042d5c5c4ce3c3b3a7e752547ae0',
    calculatedChecksum: testChecksum,
    matches: testChecksum === '6c6f042d5c5c4ce3c3b3a7e752547ae0'
  });
  
  return checksum;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage = 50000, gearbox = 'manual' } = await req.json() as ValuationRequest;
    console.log('Received request with VIN:', vin, 'Mileage:', mileage, 'Gearbox:', gearbox);

    if (!vin) {
      throw new Error('VIN number is required');
    }

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    if (!apiSecret) {
      console.error('CAR_API_SECRET is not set in environment variables');
      throw new Error('API secret is missing from environment configuration');
    }

    const checksum = calculateChecksum(apiId, apiSecret, vin);
    console.log('Calculated checksum:', checksum);

    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
    
    console.log('Making request to external API...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
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
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    if (responseData.apiStatus !== 'OK') {
      console.error('API returned error status:', responseData);
      throw new Error(responseData.message || 'API returned an error');
    }

    const valuationResult = {
      make: responseData.functionResponse?.userParams?.make || 'Not available',
      model: responseData.functionResponse?.userParams?.model || 'Not available',
      year: responseData.functionResponse?.userParams?.year || null,
      vin: vin,
      transmission: gearbox,
      fuelType: responseData.functionResponse?.userParams?.fuel || 'Not available',
      valuation: responseData.functionResponse?.valuation?.calcValuation?.price || 
                responseData.functionResponse?.valuation?.price ||
                responseData.functionResponse?.price ||
                responseData.functionResponse?.market_value ||
                0,
      averagePrice: responseData.functionResponse?.valuation?.average_price ||
                   responseData.functionResponse?.average_price ||
                   responseData.functionResponse?.market_value ||
                   0,
      rawResponse: responseData
    };

    console.log('Transformed valuation result:', valuationResult);

    return new Response(
      JSON.stringify({
        success: true,
        data: valuationResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in Edge Function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An unexpected error occurred',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});