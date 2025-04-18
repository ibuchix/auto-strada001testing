/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-18 - Improved import strategy with absolute URLs
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { formatSuccessResponse, formatErrorResponse } from "./response-formatter.ts";
import { logOperation } from "./logging.ts";
import { isValidVin, isValidMileage, ValidationError } from "./validation.ts";
import type { ValuationData } from "./types.ts";
import { getSupabaseClient } from "./client.ts";
import { calculateValuationChecksum } from "./checksum.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox } = await req.json();

    // Log the incoming request
    logOperation('valuation_request_received', { vin, mileage, gearbox });
    
    // Basic validation
    if (!isValidVin(vin)) {
      return formatErrorResponse("Invalid VIN format", 400, "VALIDATION_ERROR");
    }
    
    if (!isValidMileage(mileage)) {
      return formatErrorResponse("Invalid mileage value", 400, "VALIDATION_ERROR");
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cacheError && cachedData?.valuation_data) {
      logOperation('using_cached_valuation', { vin });
      return formatSuccessResponse(cachedData.valuation_data);
    }

    // Calculate valuation using external API
    const apiId = Deno.env.get("VALUATION_API_ID") || "";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || "";
    
    const checksum = await calculateValuationChecksum(apiId, apiSecret, vin);
    
    // Call external valuation API
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    const response = await fetch(valuationUrl);
    const valuationData = await response.json();

    if (!valuationData || valuationData.error) {
      return formatErrorResponse(
        valuationData.error || "Failed to get valuation",
        400,
        "VALUATION_ERROR"
      );
    }

    // Store in cache
    const { error: insertError } = await supabase
      .from('vin_valuation_cache')
      .insert({
        vin,
        mileage,
        valuation_data: valuationData,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      logOperation('cache_insert_error', { error: insertError.message }, 'error');
    }

    return formatSuccessResponse(valuationData);

  } catch (error) {
    logOperation('valuation_error', { 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatErrorResponse(
      `Error processing valuation request: ${error.message}`,
      500,
      "INTERNAL_ERROR"
    );
  }
});
