
/**
 * Shared utilities for edge functions
 */

// CORS headers for all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Export logging utilities
export { logOperation, createPerformanceTracker, logError } from './logging.ts';

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * Format a successful response
 */
export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Format an error response
 */
export function formatErrorResponse(
  message: string, 
  status: number = 400,
  code: string = 'ERROR'
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Format a server error response
 */
export function formatServerErrorResponse(error: Error): Response {
  return formatErrorResponse(
    `Server error: ${error.message}`,
    500,
    'SERVER_ERROR'
  );
}

/**
 * Check if a string is a valid VIN
 */
export function isValidVin(vin: string): boolean {
  // Basic VIN validation: 11-17 alphanumeric characters
  // Excludes I, O, Q as per standard
  const vinRegex = /^[A-HJ-NPR-Z0-9]{11,17}$/;
  return vinRegex.test(vin);
}

/**
 * Check if a number is a valid mileage
 */
export function isValidMileage(mileage: number): boolean {
  return !isNaN(mileage) && mileage >= 0 && mileage <= 1000000;
}

/**
 * Get a Supabase client with Service Role permissions
 */
export function getSupabaseClient() {
  const { createClient } = require('https://esm.sh/@supabase/supabase-js@2.7.1');
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    {
      auth: {
        persistSession: false
      }
    }
  );
}

/**
 * Calculate reserve price based on valuation
 */
export function calculateReservePrice(basePrice: number, requestId?: string): number {
  if (!basePrice || isNaN(basePrice)) {
    return 0;
  }
  
  let percentageDiscount;
  
  // Determine percentage based on price tier
  if (basePrice <= 15000) percentageDiscount = 0.65;
  else if (basePrice <= 20000) percentageDiscount = 0.46;
  else if (basePrice <= 30000) percentageDiscount = 0.37;
  else if (basePrice <= 50000) percentageDiscount = 0.27;
  else if (basePrice <= 60000) percentageDiscount = 0.27;
  else if (basePrice <= 70000) percentageDiscount = 0.22;
  else if (basePrice <= 80000) percentageDiscount = 0.23;
  else if (basePrice <= 100000) percentageDiscount = 0.24;
  else if (basePrice <= 130000) percentageDiscount = 0.20;
  else if (basePrice <= 160000) percentageDiscount = 0.185;
  else if (basePrice <= 200000) percentageDiscount = 0.22;
  else if (basePrice <= 250000) percentageDiscount = 0.17;
  else if (basePrice <= 300000) percentageDiscount = 0.18;
  else if (basePrice <= 400000) percentageDiscount = 0.18;
  else if (basePrice <= 500000) percentageDiscount = 0.16;
  else percentageDiscount = 0.145;
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentageDiscount));
  
  // Log calculation in non-production
  if (Deno.env.get("ENVIRONMENT") !== "production" && requestId) {
    console.log(`[${requestId}] Calculated reserve price: ${reservePrice} from base price: ${basePrice} with discount: ${percentageDiscount}`);
  }
  
  return reservePrice;
}
