
/**
 * Revised Supabase Edge Function for Vehicle Valuation
 * - Fixes URL string interpolation
 * - Adds detailed error handling for external API
 * - Logs environment variable checks and response statuses
 */
import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.217.0/crypto/mod.ts";

// Initialize Supabase client using service role key for cache writes
const supabaseUrl    = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase       = createClient(supabaseUrl, supabaseKey);

// API credentials (must be set in your Edge Function environment)
const API_ID         = Deno.env.get("VALUATION_API_ID") || "";
const API_SECRET     = Deno.env.get("VALUATION_API_SECRET") || "";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

// Helpers for formatting JSON responses
function formatSuccessResponse(data: any) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function formatErrorResponse(message: string, status = 400, code = 'ERROR') {
  return new Response(JSON.stringify({ success: false, error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Logging utility
function logOperation(operation: string, details: Record<string, any> = {}, level: 'info' | 'error' = 'info') {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), operation, level, ...details }));
}

// MD5 checksum helper
function calculateMD5(message: string): string {
  const encoder    = new TextEncoder();
  const data       = encoder.encode(message);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize nested API response into flat valuation object
function normalizeValuationData(data: any, vin: string, mileage: number) {
  logOperation('normalize:start', { vin, mileage });
  try {
    const userParams = data?.functionResponse?.userParams || {};
    const valuation   = data?.functionResponse?.valuation?.calcValuation || {};

    // Extract market price
    const marketValue = ['price','price_med','price_avr']
      .map(key => valuation[key])
      .find(v => v != null);
    if (!marketValue) {
      throw new Error('No valid price in API response');
    }

    const result = {
      make:         userParams.make || '',
      model:        userParams.model || '',
      year:         Number(userParams.year) || 0,
      vin,
      transmission: userParams.gearbox || 'manual',
      mileage,
      valuation:    Number(marketValue),
      reservePrice: Math.round(Number(marketValue) * 0.75),
      averagePrice: Number(userParams.price_avr || marketValue),
      basePrice:    Number(marketValue),
      apiSource:    'autoiso_v3',
      error:        null,
      noData:       false
    };

    logOperation('normalize:success', { result });
    return result;

  } catch (err: any) {
    logOperation('normalize:error', { message: err.message }, 'error');
    return { error: err.message, noData: true };
  }
}

// Edge Function main entrypoint
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Ensure API credentials present
  if (!API_ID || !API_SECRET) {
    logOperation('env:missing_api_keys', {}, 'error');
    return formatErrorResponse('Server configuration error', 500, 'CONFIG_ERROR');
  }

  const { searchParams } = new URL(req.url);
  const vin     = searchParams.get('vin')?.trim() || '';
  const mileage = Number(searchParams.get('mileage') || '0');

  logOperation('request:received', { vin, mileage });

  // VIN validation
  if (vin.length !== 17) {
    return formatErrorResponse('Invalid VIN; must be 17 characters', 400, 'INVALID_VIN');
  }

  // Cache lookup
  try {
    const { data: cacheData } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .eq('mileage', mileage)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheData) {
      logOperation('cache:hit', { vin, mileage });
      return formatSuccessResponse(cacheData.valuation_data);
    }
  } catch (err: any) {
    logOperation('cache:lookup_error', { message: err.message }, 'error');
    // proceed to API call
  }

  // Prepare external API call
  const checksum = calculateMD5(`${API_ID}${API_SECRET}${vin}`);
  const apiUrl   = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
  logOperation('api:calling', { url: apiUrl });

  try {
    const response     = await fetch(apiUrl);
    const responseText = await response.text();

    logOperation('api:response', { status: response.status, size: responseText.length });

    if (!response.ok) {
      logOperation('api:error_status', { status: response.status, body: responseText }, 'error');
      return formatErrorResponse(`API returned status ${response.status}`, response.status, 'API_FETCH_ERROR');
    }

    const jsonData = JSON.parse(responseText);
    if (jsonData.apiStatus !== 'OK') {
      logOperation('api:status_not_ok', { status: jsonData.apiStatus }, 'error');
      return formatErrorResponse(`External API error: ${jsonData.apiStatus}`, 400, 'API_ERROR');
    }

    // Normalize and cache
    const valuation = normalizeValuationData(jsonData, vin, mileage);
    await supabase.from('vin_valuation_cache').insert({ vin, mileage, valuation_data: valuation, created_at: new Date().toISOString() });

    return formatSuccessResponse(valuation);
  } catch (err: any) {
    logOperation('api:network_or_parse_error', { message: err.message }, 'error');
    return formatErrorResponse(`Error fetching valuation: ${err.message}`, 500, 'FETCH_ERROR');
  }
});
