
/**
 * Changes made:
 * - Created car validation schema using Zod
 * - Implemented validation for make, model, year, price, mileage, and VIN
 * - Added strict VIN format validation with 17-character requirement
 */

import { z } from 'zod';

/**
 * Schema for validating car data
 * - make: Must be at least 2 characters
 * - model: Must be at least 1 character
 * - year: Must be between 1886 (first automobile) and next year's models
 * - price: Must be at least 100
 * - mileage: Must be non-negative
 * - vin: Must be 17 characters and only contain valid VIN characters (no I, O, Q)
 */
export const carSchema = z.object({
  make: z.string().min(2, "Make must be at least 2 characters"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1886, "Year must be 1886 or later").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  price: z.number().min(100, "Price must be at least 100"),
  mileage: z.number().min(0, "Mileage cannot be negative"),
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "VIN must be 17 characters and contain only valid characters")
});

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
  mobile_number: z.string().optional()
});

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
