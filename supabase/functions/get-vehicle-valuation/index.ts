
// @ts-ignore 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

// VIN validation helper
function isValidVIN(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

// Process API response data
function processVehicleData(responseData: any, vin: string, gearbox: string) {
  console.log('Processing vehicle data:', responseData);

  // Check for essential data presence
  const make = String(responseData.make || responseData.brand || '').trim();
  const model = String(responseData.model || '').trim();
  const year = responseData.year || responseData.productionYear || '';
  const price = responseData.price || responseData.value || 0;
  const marketPrice = responseData.averageMarketPrice || responseData.marketValue || 0;

  // Calculate valuation - if we have a market price, use that as a base
  const basePrice = marketPrice > 0 ? marketPrice : price;
  const valuation = Math.max(basePrice, 0); // Ensure non-negative value

  // Log processed data for debugging
  console.log('Processed vehicle data:', {
    make,
    model,
    year,
    valuation,
    marketPrice: basePrice
  });

  // Verify we have essential data
  if (!make || !model || !year) {
    console.log('Missing essential vehicle data');
    return {
      success: true,
      data: {
        vin,
        transmission: gearbox,
        noData: true,
        error: 'Incomplete vehicle information received'
      }
    };
  }

  return {
    success: true,
    data: {
      make,
      model,
      year,
      vin,
      transmission: gearbox,
      valuation,
      averagePrice: basePrice,
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Content-Length': '0',
        'Content-Type': 'text/plain'
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { vin, mileage, gearbox } = await req.json();
    
    // Enhanced input validation
    if (!vin || !mileage || !gearbox) {
      throw new Error('Missing required parameters: VIN, mileage, and gearbox are required');
    }

    if (!isValidVIN(vin)) {
      throw new Error('Invalid VIN format');
    }

    if (mileage < 0 || mileage > 1000000) {
      throw new Error('Invalid mileage value');
    }

    console.log('Processing request for VIN:', vin, 'with mileage:', mileage);

    // API configuration
    const API_ID = 'AUTOSTRA';
    const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    
    // Calculate checksum using MD5
    const encoder = new TextEncoder();
    const data = encoder.encode(API_ID + API_SECRET + vin);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Calculated checksum:', checksum);
    
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    console.log('Making API request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error(`Vehicle data service error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Raw API Response:', responseData);

    // Process the response data
    const result = processVehicleData(responseData, vin, gearbox);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    
    // More specific error handling
    const errorMessage = error.message || 'Failed to get vehicle valuation';
    const errorResponse = {
      success: false,
      data: {
        error: errorMessage,
        vin: null,
        transmission: null
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: error.message === 'Method not allowed' ? 405 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
