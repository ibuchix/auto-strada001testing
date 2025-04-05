
/**
 * Edge function for VIN validation
 * 
 * This function validates vehicle identification numbers (VINs) by:
 * 1. Checking format validity
 * 2. Verifying if the vehicle already exists in the database
 * 3. Fetching valuation data when needed
 * 
 * Updated: Using consistent module versions and imports
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  logOperation,
  ValidationError,
  formatSuccessResponse,
  formatErrorResponse,
  formatServerErrorResponse,
  getSupabaseClient,
  isValidVin,
  isValidMileage
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
  userId: z.string().uuid("Invalid user ID format").optional()
});

// Rate limiting cache
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Check rate limiting for a VIN
function checkRateLimit(vin: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitCache.get(vin);
  
  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
    return true; // Rate limited
  }
  
  rateLimitCache.set(vin, now);
  return false; // Not rate limited
}

// Check if vehicle exists in database
async function checkVehicleExists(supabase, vin: string, requestId: string): Promise<boolean> {
  try {
    // Check if the VIN exists in the cars table (excluding drafts)
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
      return false; // Assume it doesn't exist if there's an error
    }
    
    // If data exists and it's not a draft, the car exists
    const exists = !!data;
    
    logOperation('vehicle_check', { 
      requestId, 
      vin, 
      exists
    });
    
    return exists;
  } catch (error) {
    logOperation('vehicle_check_exception', { 
      requestId, 
      vin, 
      error: error.message,
      stack: error.stack
    }, 'error');
    return false;
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

// Main handler function
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
    
    const { vin, mileage, userId } = parseResult.data;
    
    // Apply rate limiting
    if (checkRateLimit(vin)) {
      return formatErrorResponse(
        'Too many requests for this VIN. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    // Initialize Supabase client
    const supabase = getSupabaseClient();
    
    // First check if this vehicle already exists in the database
    const vehicleExists = await checkVehicleExists(supabase, vin, requestId);
    
    if (vehicleExists) {
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
            valuationData
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
        shouldCreateReservation: !!userId
      });
    }
    
    // At this point, the VIN is valid and doesn't exist, but we don't have cached data
    // Return a basic validation result
    return formatSuccessResponse({
      isValid: true,
      vin,
      mileage,
      requiresValuation: true,
      shouldCreateReservation: !!userId
    });
    
  } catch (error) {
    if (error instanceof ValidationError) {
      return formatErrorResponse(error.message, 400, error.code);
    }
    
    return formatServerErrorResponse(error);
  }
});
