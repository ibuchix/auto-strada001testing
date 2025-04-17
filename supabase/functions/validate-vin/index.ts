
/**
 * Modified Supabase Edge Function for VIN Validation
 * 
 * Changes:
 * - Refactored into smaller modules for better maintainability
 * - Maintained all existing functionality
 * - Improved code organization
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  logOperation,
  ValidationError,
  formatSuccessResponse,
  formatErrorResponse,
  formatServerErrorResponse,
  getSupabaseClient
} from "../_shared/index.ts";
import { validateVinSchema } from "./schema.ts";
import { checkRateLimit } from "./rate-limiter.ts";
import { checkVehicleExists } from "./vehicle-checker.ts";
import { checkExistingReservation } from "./reservation-checker.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const requestId = crypto.randomUUID();
    logOperation('validate_vin_request_received', { requestId });
    
    const requestData = await req.json();
    const parseResult = validateVinSchema.safeParse(requestData);
    
    if (!parseResult.success) {
      return formatErrorResponse(
        parseResult.error.errors.map(e => e.message).join(', '),
        400,
        'VALIDATION_ERROR'
      );
    }
    
    const { vin, mileage, userId, allowExisting = false, isTesting = false } = parseResult.data;
    
    if (!isTesting && checkRateLimit(vin)) {
      return formatErrorResponse(
        'Too many requests for this VIN. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    const supabase = getSupabaseClient();
    const vehicleCheck = await checkVehicleExists(supabase, vin, requestId);
    
    if (vehicleCheck.exists && !allowExisting) {
      logOperation('vin_already_exists', { requestId, vin });
      return formatErrorResponse(
        "A vehicle with this VIN already exists in our system",
        400,
        'VIN_EXISTS'
      );
    }
    
    if (userId) {
      const reservationCheck = await checkExistingReservation(supabase, vin, userId);
      
      if (reservationCheck.valid && reservationCheck.reservation) {
        const valuationData = reservationCheck.reservation.valuation_data;
        
        if (valuationData) {
          return formatSuccessResponse({
            reservationExists: true,
            vin,
            mileage,
            make: valuationData.make,
            model: valuationData.model,
            year: valuationData.year,
            reservationId: reservationCheck.reservation.id,
            valuationData,
            vehicleExists: vehicleCheck.exists
          });
        }
      }
    }
    
    const { data: cachedValidation, error: cacheError } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!cacheError && cachedValidation?.valuation_data) {
      logOperation('using_cached_validation', { requestId, vin });
      
      return formatSuccessResponse({
        cached: true,
        vin,
        mileage,
        ...cachedValidation.valuation_data,
        shouldCreateReservation: !!userId,
        vehicleExists: vehicleCheck.exists
      });
    }
    
    return formatSuccessResponse({
      isValid: true,
      vin,
      mileage,
      requiresValuation: true,
      shouldCreateReservation: !!userId,
      vehicleExists: vehicleCheck.exists
    });
    
  } catch (error) {
    if (error instanceof ValidationError) {
      return formatErrorResponse(error.message, 400, error.code);
    }
    
    return formatServerErrorResponse(error);
  }
});
