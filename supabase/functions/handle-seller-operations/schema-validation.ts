
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

// Derived type from the schema
export type ValuationRequest = z.infer<typeof valuationRequestSchema>;

// Schema for car operations
export const carOperationSchema = z.object({
  operation: z.enum(["get_valuation", "submit_listing", "get_proxy_bids"]),
  carId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  data: z.record(z.unknown()).optional()
});

// Type for car operations
export type CarOperation = z.infer<typeof carOperationSchema>;

// Schema for the response
export const carResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  errorCode: z.string().optional()
});

// Type for the response
export type CarResponse = z.infer<typeof carResponseSchema>;
