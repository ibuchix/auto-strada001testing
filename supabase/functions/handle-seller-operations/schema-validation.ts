
/**
 * Schema validation for handle-seller-operations edge function
 * Created: 2025-04-19
 * Updated: 2025-05-23 - Added more operation types
 * Updated: 2025-06-01 - Added set_temp_uploads and associate_images operations
 */

import { z } from 'https://esm.sh/zod@3.22.2';
import { TransmissionType } from './types.ts';

// Base validation function with generic return type
export function validateSchema<T>(schema: z.ZodType<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  error?: string;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');
      
      return { success: false, error: errorMessage };
    }
    
    return { success: false, error: 'Validation failed' };
  }
}

// Schema for VIN validation request
export const valuationRequestSchema = z.object({
  operation: z.literal('get_valuation'),
  vin: z.string()
    .min(11, "VIN must be at least 11 characters")
    .max(17, "VIN must be at most 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]+$/, "VIN contains invalid characters"),
  mileage: z.number()
    .int("Mileage must be an integer")
    .min(0, "Mileage cannot be negative"),
  gearbox: z.enum(["manual", "automatic"] as const),
  userId: z.string().uuid("Invalid user ID format")
});

// Schema for image association request
export const imageAssociationSchema = z.object({
  operation: z.literal('associate_images'),
  carId: z.string().uuid("Invalid car ID format")
});

// Schema for temp uploads request
export const tempUploadsSchema = z.object({
  operation: z.literal('set_temp_uploads'),
  uploads: z.array(z.record(z.any()))
});

// Schema for direct upload association request
export const directAssociateSchema = z.object({
  operation: z.literal('associate_uploads'),
  carId: z.string().uuid("Invalid car ID format"),
  uploads: z.array(z.record(z.any()))
});

// Schema for VIN reservation request
export const vinReservationSchema = z.object({
  operation: z.literal('reserve_vin'),
  vin: z.string()
    .min(11, "VIN must be at least 11 characters")
    .max(17, "VIN must be at most 17 characters"),
  userId: z.string().uuid("Invalid user ID format")
});

// Schema for proxy bids request
export const proxyBidsSchema = z.object({
  operation: z.literal('process_proxy_bids'),
  carId: z.string().uuid("Invalid car ID format")
});

// Schema for create listing request
export const createListingSchema = z.object({
  operation: z.literal('create_listing'),
  // Add detailed validation as needed
  userId: z.string().uuid("Invalid user ID format"),
  data: z.record(z.any()).optional()
});

// Combined schema using discriminated union
export const requestSchema = z.discriminatedUnion("operation", [
  valuationRequestSchema,
  imageAssociationSchema,
  tempUploadsSchema,
  directAssociateSchema,
  vinReservationSchema,
  proxyBidsSchema,
  createListingSchema
]);

// Derived types from the schemas
export type ValuationRequest = z.infer<typeof valuationRequestSchema>;
export type ImageAssociationRequest = z.infer<typeof imageAssociationSchema>;
export type TempUploadsRequest = z.infer<typeof tempUploadsSchema>;
export type DirectAssociateRequest = z.infer<typeof directAssociateSchema>;
export type VinReservationRequest = z.infer<typeof vinReservationSchema>;
export type ProxyBidsRequest = z.infer<typeof proxyBidsSchema>;
export type CreateListingRequest = z.infer<typeof createListingSchema>;
