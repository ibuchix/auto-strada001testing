
/**
 * VIN Validation Edge Function
 * Updated: 2025-04-28 - Refactored for better organization and error handling
 */

import { corsHeaders } from './utils/cors.ts';
import { logOperation, logRequestDiagnostics } from './utils/logging.ts';
import { validateRequest } from './utils/validation.ts';
import { handleApiError } from './utils/error-handling.ts';
import { getValuation } from './services/valuation-service.ts';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logOperation('vin_validation_request_received', { 
      requestId,
      method: req.method,
      url: req.url
    });

    // Parse and validate request
    const requestText = await req.text();
    logRequestDiagnostics(requestId, req, requestText);
    
    let requestData;
    try {
      requestData = JSON.parse(requestText);
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    // Validate input
    validateRequest(requestData, requestId);

    // Get valuation data
    const result = await getValuation({
      vin: requestData.vin,
      mileage: Number(requestData.mileage),
      requestId
    });

    logOperation('vin_validation_complete', {
      requestId,
      vin: requestData.vin,
      success: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
});
