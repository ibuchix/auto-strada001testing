
/**
 * Changes made:
 * - Created car validation schema using Zod
 * - Implemented validation for make, model, year, price, mileage, and VIN
 * - Added strict VIN format validation with 17-character requirement
 * - Added TypeScript type inference from Zod schema
 */

import { z } from 'zod';

// Schema for basic car validation
export const carSchema = z.object({
  make: z.string().min(2, "Make must be at least 2 characters"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1886, "Year must be 1886 or later").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  price: z.number().min(100, "Price must be at least 100"),
  mileage: z.number().min(0, "Mileage cannot be negative"),
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "VIN must be 17 characters and contain only valid characters")
});

// Type inference from the schema
export type CarData = z.infer<typeof carSchema>;

// Extended schema with optional fields
export const extendedCarSchema = carSchema.extend({
  transmission: z.enum(["manual", "automatic"]).optional(),
  features: z.record(z.boolean()).optional(),
  is_damaged: z.boolean().optional(),
  is_registered_in_poland: z.boolean().optional(),
  has_private_plate: z.boolean().optional(),
  finance_amount: z.number().optional().nullable(),
  service_history_type: z.string().optional(),
  seller_notes: z.string().optional(),
  seat_material: z.string().optional(),
  number_of_keys: z.number().optional(),
  seller_id: z.string().uuid().optional(),
  seller_name: z.string().optional(),
  address: z.string().optional(),
  mobile_number: z.string().optional(),
  // Form metadata
  form_metadata: z.object({
    currentStep: z.number().optional(),
    lastSavedAt: z.string().optional(),
  }).optional(),
  // Idempotency
  idempotencyKey: z.string().optional()
});

// Type for extended car data
export type ExtendedCarData = z.infer<typeof extendedCarSchema>;

// Type for car validation results
export type CarValidationResult = {
  success: boolean;
  errors?: z.ZodError;
};

/**
 * Validate car data against schema
 * @param data The car data to validate
 * @returns Validation result with success status and any errors
 */
export const validateCar = (data: any): CarValidationResult => {
  try {
    carSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error 
      };
    }
    throw error;
  }
};

/**
 * Validate extended car data against schema
 * @param data The extended car data to validate
 * @returns Validation result with success status and any errors
 */
export const validateExtendedCar = (data: any): CarValidationResult => {
  try {
    extendedCarSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error 
      };
    }
    throw error;
  }
};
