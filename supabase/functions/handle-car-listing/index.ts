import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { vin, mileage, gearbox }: ValuationRequest = await req.json()
    console.log('Received request:', { vin, mileage, gearbox })

    if (!vin || !mileage || !gearbox) {
      throw new Error('Missing required fields')
    }

    // Get API credentials from environment variables
    const apiId = Deno.env.get('CAR_API_ID')
    const apiSecret = Deno.env.get('CAR_API_SECRET')

    if (!apiId || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    // Calculate checksum
    const input = `${apiId}${apiSecret}${vin}`
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('MD5', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    console.log('Calculated checksum:', checksum)

    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`
    
    console.log('Calling API:', apiUrl)

    // Make API request
    const response = await fetch(apiUrl)
    const valuationData = await response.json()

    console.log('Received valuation data:', valuationData)

    if (!valuationData || valuationData.error) {
      throw new Error(valuationData.error || 'Failed to get valuation')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store the search result with complete valuation data
    const { error: searchError } = await supabase
      .from('vin_search_results')
      .insert({
        vin,
        search_data: valuationData,
        user_id: req.headers.get('authorization')?.split('Bearer ')[1]
      })

    if (searchError) {
      console.error('Error storing search result:', searchError)
    }

    // Return only the fields that match our database schema
    return new Response(
      JSON.stringify({
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        vin: vin,
        mileage: mileage,
        valuation: valuationData.valuation
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
})