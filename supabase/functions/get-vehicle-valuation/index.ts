
/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-28 - Added enhanced error handling and logging
 */

import { corsHeaders } from './utils/cors.ts';
import { logOperation } from './utils/logging.ts';
import { validateRequest, isValidVin, isValidMileage } from './utils/validation.ts';
import { ValuationError, handleApiError, formatErrorResponse } from './utils/error-handling.ts';
import md5 from "https://cdn.skypack.dev/md5@2.3.0";

const API_ID = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
const API_SECRET = Deno.env.get('CAR_API_SECRET') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  logOperation('request_received', {
    requestId,
    method: req.method,
    url: req.url
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    let requestData;
    try {
      const requestText = await req.text();
      logOperation('request_body_received', {
        requestId,
        bodyLength: requestText.length,
        body: requestText.substring(0, 200) // Log first 200 chars for debugging
      });
      
      if (!requestText) {
        throw new ValuationError('Empty request body', 'EMPTY_REQUEST');
      }
      
      requestData = JSON.parse(requestText);
    } catch (e) {
      logOperation('request_parse_error', {
        requestId,
        error: e instanceof Error ? e.message : String(e)
      }, 'error');
      
      throw new ValuationError(
        'Invalid JSON in request body',
        'PARSE_ERROR',
        [{ field: 'body', message: 'Must be valid JSON' }]
      );
    }

    // Validate VIN
    const vin = requestData?.vin;
    if (!vin) {
      throw new ValuationError(
        'VIN is required',
        'MISSING_VIN',
        [{ field: 'vin', message: 'VIN must be provided' }]
      );
    }

    if (!isValidVin(vin)) {
      throw new ValuationError(
        'Invalid VIN format',
        'INVALID_VIN',
        [{
          field: 'vin',
          message: 'VIN must be 17 characters and contain only letters and numbers',
          value: vin
        }]
      );
    }

    // Validate mileage
    const mileage = requestData?.mileage;
    if (mileage === undefined || mileage === null) {
      throw new ValuationError(
        'Mileage is required',
        'MISSING_MILEAGE',
        [{ field: 'mileage', message: 'Mileage must be provided' }]
      );
    }

    const numericMileage = Number(mileage);
    if (!isValidMileage(numericMileage)) {
      throw new ValuationError(
        'Invalid mileage value',
        'INVALID_MILEAGE',
        [{
          field: 'mileage',
          message: 'Mileage must be a positive number under 1,000,000',
          value: mileage
        }]
      );
    }

    // Calculate checksum and build API URL
    const checksumContent = API_ID + API_SECRET + vin;
    const checksum = md5(checksumContent);
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${numericMileage}/currency:PLN`;

    logOperation('calling_external_api', {
      requestId,
      vin,
      mileage: numericMileage
    });

    // Call external API
    const apiResponse = await fetch(apiUrl);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      logOperation('external_api_error', {
        requestId,
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        responseBody: errorText
      }, 'error');
      
      throw new ValuationError(
        'External valuation service error',
        'API_ERROR',
        [{
          field: 'api',
          message: `API responded with status ${apiResponse.status}`,
          value: apiResponse.statusText
        }]
      );
    }

    const apiData = await apiResponse.json();
    logOperation('api_response_received', {
      requestId,
      hasData: !!apiData,
      dataKeys: Object.keys(apiData)
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: apiData
      }),
      {
        status: 200,
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
