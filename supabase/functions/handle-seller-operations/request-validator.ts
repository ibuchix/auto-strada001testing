
/**
 * Changes made:
 * - 2024-07-22: Created dedicated request validation module
 */

import { z } from "https://esm.sh/zod@3.22.2";

// Input validation schemas
const validateVinSchema = z.object({
  operation: z.literal("validate_vin"),
  vin: z.string().min(17).max(17),
  mileage: z.number().positive(),
  gearbox: z.string(),
  userId: z.string().uuid()
});

const getValuationSchema = z.object({
  operation: z.literal("get_valuation"),
  vin: z.string().min(17).max(17),
  mileage: z.number().positive(),
  gearbox: z.string().optional().default("manual"),
  currency: z.string().optional().default("PLN")
});

const reserveVinSchema = z.object({
  operation: z.literal("reserve_vin"),
  vin: z.string().min(17).max(17),
  userId: z.string().uuid()
});

const createListingSchema = z.object({
  operation: z.literal("create_listing"),
  userId: z.string().uuid(),
  vin: z.string().min(17).max(17),
  valuationData: z.record(z.any()),
  mileage: z.number().positive(),
  transmission: z.string(),
  reservationId: z.string().uuid().optional()
});

const processProxyBidsSchema = z.object({
  operation: z.literal("process_proxy_bids"),
  carId: z.string().uuid()
});

const operationSchema = z.union([
  validateVinSchema,
  getValuationSchema,
  reserveVinSchema,
  createListingSchema,
  processProxyBidsSchema
]);

/**
 * Validates incoming request data against schema
 * @param requestData Request data to validate
 * @returns Validation result with parsed data or error details
 */
export function validateRequest(requestData: unknown): {
  success: boolean;
  data?: z.infer<typeof operationSchema>;
  error?: string;
  details?: any;
} {
  const parseResult = operationSchema.safeParse(requestData);
  
  if (!parseResult.success) {
    return {
      success: false,
      error: "Invalid request format",
      details: parseResult.error.issues
    };
  }
  
  return {
    success: true,
    data: parseResult.data
  };
}
