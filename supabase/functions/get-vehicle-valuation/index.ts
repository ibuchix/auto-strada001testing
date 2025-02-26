
// @ts-ignore 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHash } from 'https://deno.land/std@0.202.0/hash/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox } = await req.json();
    
    if (!vin || !mileage || !gearbox) {
      throw new Error('Missing required parameters');
    }

    console.log('Received request for VIN:', vin, 'with mileage:', mileage);

    // API configuration
    const API_ID = 'AUTOSTRA';
    const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    
    // Calculate checksum
    const checksum = createHash('md5')
      .update(API_ID + API_SECRET + vin)
      .toString();
    
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
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    // Process the API response and format it according to your needs
    const processedData = {
      success: true,
      data: {
        make: data.make || '',
        model: data.model || '',
        year: data.year || '',
        vin,
        transmission: gearbox,
        valuation: data.valuation || data.price || 0,
        averagePrice: data.averageMarketPrice || data.valuation || 0,
      }
    };

    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      data: {
        error: error.message || 'Failed to get vehicle valuation'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
