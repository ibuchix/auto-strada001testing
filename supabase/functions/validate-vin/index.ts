/**
 * Modified Supabase Edge Function for VIN Validation
 * 
 * Changes:
 * - Modified checkVehicleExists to flag existence but not reject validation
 * - Added allowExisting parameter to bypass existence check
 * - Adjusted rate limiting logic to be less aggressive
 * - Improved error handling and logging
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
import { z } from "https://esm.sh/zod@3.22.4";

// Input validation schema
const validateVinSchema = z.object({
  vin: z.string()
    .min(11, "VIN must be at least 11 characters")
    .max(17, "VIN must be at most 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]+$/, "VIN contains invalid characters"),
  mileage: z.number()
    .int("Mileage must be an integer")
    .min(0, "Mileage cannot be negative"),
  userId: z.string().uuid("Invalid user ID format").optional(),
  allowExisting: z.boolean().optional().default(false),
  isTesting: z.boolean().optional().default(false)
});

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; firstRequest: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Modified rate limiting function to be less aggressive
function checkRateLimit(vin: string) {
  const now = Date.now();
  const key = `rate_limit:${vin}`;
  
  // Get current rate limit data
  const rateLimitData = rateLimitCache.get(key);
  
  if (!rateLimitData) {
    // No rate limit data, create new entry
    rateLimitCache.set(key, {
      count: 1,
      firstRequest: now,
      lastRequest: now
    });
    return false; // Not rate limited
  }
  
  // Update rate limit data
  rateLimitData.count += 1;
  rateLimitData.lastRequest = now;
  
  // Check if rate limited - increased limits from original
  const isRateLimited = 
    rateLimitData.count > 15 && // Increased from 10
    (now - rateLimitData.firstRequest) < 60000; // 1 minute window
  
  // Reset counter if window has passed
  if (now - rateLimitData.firstRequest > 60000) {
    rateLimitData.count = 1;
    rateLimitData.firstRequest = now;
  }
  
  rateLimitCache.set(key, rateLimitData);
  
  return isRateLimited;
}

// Check if vehicle exists in database with enhanced return data
async function checkVehicleExists(supabase, vin: string, requestId: string) {
  try {
    logOperation('vehicle_check_started', { 
      requestId, 
      vin 
    });
    
    const { data, error } = await supabase
      .from('cars')
      .select('id, is_draft')
      .eq('vin', vin)
      .is('is_draft', false)  // Only consider non-draft listings
      .maybeSingle();
    
    if (error) {
      logOperation('vehicle_check_error', { 
        requestId, 
        vin, 
        error: error.message 
      }, 'error');
      return { exists: false, error: error.message }; // Return error info but don't fail
    }
    
    // If data exists and it's not a draft, the car exists
    const exists = !!data;
    
    logOperation('vehicle_check', { 
      requestId, 
      vin, 
      exists
    });
    
    return { exists, carData: data };
  } catch (error) {
    logOperation('vehicle_check_exception', { 
      requestId, 
      vin, 
      error: error.message,
      stack: error.stack
    }, 'error');
    return { exists: false, error: error.message };
  }
}

// Check existing reservation for a VIN
async function checkExistingReservation(supabase, vin: string, userId: string | undefined) {
  if (!userId) return { valid: false, error: 'User ID is required to check reservations' };
  
  const { data: reservation, error } = await supabase
    .from('vin_reservations')
    .select('*')
    .eq('vin', vin)
    .eq('status', 'active')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    return { valid: false, error: `Error checking reservation: ${error.message}` };
  }
  
  if (!reservation) {
    return { valid: false, error: 'No active reservation found' };
  }
  
  // Check if reservation has expired
  const now = new Date();
  const expiresAt = new Date(reservation.expires_at);
  
  if (now > expiresAt) {
    return { valid: false, error: 'Reservation has expired' };
  }
  
  return { valid: true, reservation };
}

// Modified main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const requestId = crypto.randomUUID();
    logOperation('validate_vin_request_received', { requestId });
    
    // Parse request body
    const requestData = await req.json();
    
    // Validate schema
    const parseResult = validateVinSchema.safeParse(requestData);
    if (!parseResult.success) {
      return formatErrorResponse(
        parseResult.error.errors.map(e => e.message).join(', '),
        400,
        'VALIDATION_ERROR'
      );
    }
    
    // Extract parameters with new allowExisting option
    const { vin, mileage, userId, allowExisting = false, isTesting = false } = parseResult.data;
    
    // Apply rate limiting with bypass for testing
    if (!isTesting && checkRateLimit(vin)) {
      return formatErrorResponse(
        'Too many requests for this VIN. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    // Initialize Supabase client
    const supabase = getSupabaseClient();
    
    // Check if this vehicle already exists in the database
    const vehicleCheck = await checkVehicleExists(supabase, vin, requestId);
    
    // Only reject if vehicle exists and allowExisting is false
    if (vehicleCheck.exists && !allowExisting) {
      logOperation('vin_already_exists', { 
        requestId, 
        vin 
      });
      
      return formatErrorResponse(
        "A vehicle with this VIN already exists in our system",
        400,
        'VIN_EXISTS'
      );
    }
    
    // If userId is provided, check for an existing reservation
    if (userId) {
      const reservationCheck = await checkExistingReservation(supabase, vin, userId);
      
      if (reservationCheck.valid && reservationCheck.reservation) {
        // Return the cached validation data from the reservation
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
            vehicleExists: vehicleCheck.exists // Add flag to indicate if vehicle exists
          });
        }
      }
    }
    
    // Check cache for recent validations
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
        vehicleExists: vehicleCheck.exists // Add flag to indicate if vehicle exists
      });
    }
    
    // At this point, the VIN is valid and doesn't exist, but we don't have cached data
    // Return a basic validation result
    return formatSuccessResponse({
      isValid: true,
      vin,
      mileage,
      requiresValuation: true,
      shouldCreateReservation: !!userId,
      vehicleExists: vehicleCheck.exists // Add flag to indicate if vehicle exists
    });
    
  } catch (error) {
    if (error instanceof ValidationError) {
      return formatErrorResponse(error.message, 400, error.code);
    }
    
    return formatServerErrorResponse(error);
  }
});
