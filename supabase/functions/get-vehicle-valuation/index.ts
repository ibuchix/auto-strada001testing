
/**
 * Revised Supabase Edge Function for Vehicle Valuation
 * - Supports GET (query params) and POST (JSON body)
 * - Implements proper reserve price calculation based on tiered pricing model
 * - Adds detailed error handling for external API
 * - Logs environment variable checks and response statuses
 * - Stores raw API response for diagnostics
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

/**
 * Calculate reserve price based on tiered pricing model
 * 
 * Formula: PriceX – (PriceX x PercentageY)
 * where PriceX is the base price (avg of price_min + price_med)
 * and PercentageY depends on the PriceX value tier
 */
function calculateReservePrice(basePrice: number): number {
  // Determine percentage based on price range
  let percentageY: number;
  
  if (basePrice <= 15000) percentageY = 0.65;
  else if (basePrice <= 20000) percentageY = 0.46;
  else if (basePrice <= 30000) percentageY = 0.37;
  else if (basePrice <= 50000) percentageY = 0.27; 
  else if (basePrice <= 60000) percentageY = 0.27;
  else if (basePrice <= 70000) percentageY = 0.22;
  else if (basePrice <= 80000) percentageY = 0.23;
  else if (basePrice <= 100000) percentageY = 0.24;
  else if (basePrice <= 130000) percentageY = 0.20;
  else if (basePrice <= 160000) percentageY = 0.185;
  else if (basePrice <= 200000) percentageY = 0.22;
  else if (basePrice <= 250000) percentageY = 0.17;
  else if (basePrice <= 300000) percentageY = 0.18;
  else if (basePrice <= 400000) percentageY = 0.18;
  else if (basePrice <= 500000) percentageY = 0.16;
  else percentageY = 0.145; // for values above 500,000 PLN
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  return Math.round(basePrice - (basePrice * percentageY));
}

// Normalize nested API response into flat valuation object
function normalizeValuationData(data: any, vin: string, mileage: number) {
  logOperation('normalize:start', { vin, mileage });
  try {
    const userParams = data?.functionResponse?.userParams || {};
    const valuation = data?.functionResponse?.valuation?.calcValuation || {};

    // Extract required price values with fallbacks
    const price_min = Number(valuation.price_min) || 0;
    const price_med = Number(valuation.price_med) || 0;
    const price_avr = Number(valuation.price_avr) || 0;
    
    // Calculate base price (PriceX) as average of price_min and price_med 
    // per the requirements: price_min + price_med divided by 2
    const basePrice = price_min && price_med ? (price_min + price_med) / 2 : 
                      (valuation.price || price_avr || 0);

    // Get market value for display purposes
    const marketValue = basePrice || price_avr || valuation.price || 0;
    
    if (!marketValue) {
      throw new Error('No valid price in API response');
    }
    
    // Calculate reserve price using the required formula and percentages
    const reservePrice = calculateReservePrice(basePrice);

    const result = {
      make:         userParams.make || '',
      model:        userParams.model || '',
      year:         Number(userParams.year) || 0,
      vin,
      transmission: userParams.gearbox || 'manual',
      mileage,
      valuation:    Number(marketValue),
      reservePrice: reservePrice,
      averagePrice: Number(price_avr || marketValue),
      minPrice:     price_min,
      maxPrice:     Number(valuation.price_max || 0),
      basePrice:    basePrice,
      apiSource:    'autoiso_v3',
      error:        null,
      noData:       false,
      rawApiResponse: data // Include raw response for diagnostics
    };

    logOperation('normalize:success', { 
      result: {
        ...result,
        rawApiResponse: `[${typeof data}:${Object.keys(data).length} keys]` // Don't log entire raw API response
      }
    });
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

  // Extract vin & mileage from GET query or POST JSON
  let vin = '';
  let mileage = 0;
  let gearbox = 'manual';

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      vin = body.vin?.trim() || '';
      mileage = Number(body.mileage) || 0;
      gearbox = body.gearbox || 'manual';
      
      if (body.debug) {
        logOperation('debug_mode:enabled', { 
          vin, 
          mileage, 
          requestId: body.requestId || 'none' 
        });
      }
    } catch (_e) {
      vin = '';
      mileage = 0;
    }
  } else {
    const url = new URL(req.url);
    vin = url.searchParams.get('vin')?.trim() || '';
    mileage = Number(url.searchParams.get('mileage') || '0');
    gearbox = url.searchParams.get('gearbox') || 'manual';
  }
  logOperation('request:received', { vin, mileage, gearbox });

  // Validate VIN
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
    const response = await fetch(apiUrl);
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
