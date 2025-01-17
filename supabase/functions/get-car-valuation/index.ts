import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const API_BASE_URL = 'https://bp.autoiso.pl/api/v3';
const API_ID = 'AUTOSTRA';

interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: 'manual' | 'automatic';
}

serve(async (req) => {
  console.log('Valuation request received:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox = 'manual' } = await req.json() as ValuationRequest;
    console.log('Request data:', { vin, mileage, gearbox });

    // Input validation
    if (!vin || !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      throw new Error('Invalid VIN format');
    }
    if (!mileage || mileage < 0 || mileage > 1000000) {
      throw new Error('Invalid mileage');
    }

    // Get API secret from environment
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    if (!apiSecret) {
      throw new Error('API secret not configured');
    }

    // Calculate checksum
    const input = `${API_ID}${apiSecret}${vin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Checksum calculated:', checksum);

    // Fetch vehicle details and valuation in parallel
    const [detailsResponse, valuationResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/getVinDetails/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AutoStra-API-Client/1.0'
        }
      }),
      fetch(`${API_BASE_URL}/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox}/currency:PLN`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AutoStra-API-Client/1.0'
        }
      })
    ]);

    if (!detailsResponse.ok || !valuationResponse.ok) {
      console.error('API Error:', {
        details: detailsResponse.status,
        valuation: valuationResponse.status
      });
      throw new Error('Failed to fetch vehicle data');
    }

    const details = await detailsResponse.json();
    const valuation = await valuationResponse.json();

    console.log('API Responses:', {
      details: details,
      valuation: valuation
    });

    // Process and combine the responses
    const response = {
      success: true,
      data: {
        make: details.make || 'Unknown',
        model: details.model || 'Unknown',
        year: parseInt(details.year) || new Date().getFullYear(),
        vin: vin,
        transmission: gearbox,
        mileage: mileage,
        valuation: valuation.price || valuation.valuation || null,
        averagePrice: valuation.averagePrice || null,
        rawDetails: details,
        rawValuation: valuation
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});