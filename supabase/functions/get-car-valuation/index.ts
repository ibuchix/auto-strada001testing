import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { ValuationRequest } from "./types.ts";
import { handleManualValuation, handleVinValuation } from "./services/valuationService.ts";

serve(async (req) => {
  console.log('Received request:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: ValuationRequest = await req.json();
    console.log('Processing valuation request:', requestData);

    if (!requestData) {
      throw new Error('Request data is required');
    }

    const valuationResult = requestData.isManualEntry 
      ? await handleManualValuation(requestData)
      : await handleVinValuation(requestData);

    console.log('Valuation completed successfully:', valuationResult);

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
        data: null
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});