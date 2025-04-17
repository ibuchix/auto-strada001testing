
/**
 * Schema validation for VIN validation requests
 */
import { z } from "https://esm.sh/zod@3.22.4";

export const validateVinSchema = z.object({
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

export type ValidateVinRequest = z.infer<typeof validateVinSchema>;
