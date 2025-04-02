
/**
 * Request validation for handle-seller-operations edge function
 */
import { z } from "https://esm.sh/zod@3.22.2";

// Base schema for all requests
const baseSchema = z.object({
  operation: z.enum([
    "validate_vin", 
    "get_valuation", 
    "reserve_vin", 
    "create_listing", 
    "process_proxy_bids", 
    "cache_valuation",
    "get_cached_valuation"
  ])
});

// VIN validation request schema
const validateVinSchema = baseSchema.extend({
  operation: z.literal("validate_vin"),
  vin: z.string().min(11).max(17),
  mileage: z.number().int().min(0),
  userId: z.string().uuid().optional()
});

// Valuation request schema
const valuationSchema = baseSchema.extend({
  operation: z.literal("get_valuation"),
  vin: z.string().min(11).max(17),
  mileage: z.number().int().min(0),
  gearbox: z.string(),
  userId: z.string().uuid()
});

// VIN reservation request schema
const reserveVinSchema = baseSchema.extend({
  operation: z.literal("reserve_vin"),
  vin: z.string().min(11).max(17),
  mileage: z.number().int().min(0),
  gearbox: z.string(),
  userId: z.string().uuid(),
  makeModel: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number().int().min(1900).max(2100)
  }).optional()
});

// Create listing request schema
const createListingSchema = baseSchema.extend({
  operation: z.literal("create_listing"),
  userId: z.string().uuid(),
  vin: z.string().min(11).max(17),
  mileage: z.number().int().min(0),
  valuationData: z.record(z.any()),
  transmission: z.string(),
  reservationId: z.string().uuid().optional()
});

// Process proxy bids request schema
const processProxyBidsSchema = baseSchema.extend({
  operation: z.literal("process_proxy_bids"),
  carId: z.string().uuid()
});

// Cache valuation request schema
const cacheValuationSchema = baseSchema.extend({
  operation: z.literal("cache_valuation"),
  vin: z.string().min(11).max(17),
  mileage: z.number().int().min(0),
  valuation_data: z.record(z.any())
});

// Get cached valuation request schema
const getCachedValuationSchema = baseSchema.extend({
  operation: z.literal("get_cached_valuation"),
  vin: z.string().min(11).max(17),
  mileage: z.number().int().min(0)
});

// Combined schema using discriminated union
const requestSchema = z.discriminatedUnion("operation", [
  validateVinSchema,
  valuationSchema,
  reserveVinSchema,
  createListingSchema,
  processProxyBidsSchema,
  cacheValuationSchema,
  getCachedValuationSchema
]);

// Validate request against schema
export function validateRequest(data: any): { success: boolean; data?: any; error?: string; details?: any } {
  const result = requestSchema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  } else {
    return {
      success: false,
      error: "Invalid request format",
      details: result.error.format()
    };
  }
}
