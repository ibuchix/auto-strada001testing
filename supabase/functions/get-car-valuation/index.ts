import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ValuationRequest } from "./types.ts";
import { handleManualValuation, handleVinValuation } from "./services/valuationService.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: ValuationRequest = await req.json();
    console.log('Received valuation request:', requestData);

    const valuationResult = requestData.isManualEntry 
      ? await handleManualValuation(requestData)
      : await handleVinValuation(requestData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valuation completed successfully',
        data: valuationResult
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Valuation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An error occurred during valuation',
        data: {
          make: 'Not available',
          model: 'Not available',
          year: null,
          vin: '',
          transmission: 'Not available',
          valuation: 0,
          mileage: 0
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});