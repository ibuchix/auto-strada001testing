
/**
 * Changes made:
 * - 2025-04-28: Enhanced validation schema with more specific rules
 * - Added detailed error messages and strict type checking
 */

import { z } from "zod";

export const valuationFormSchema = z.object({
  vin: z.string()
    .length(17, "VIN must be exactly 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN must contain only valid characters (A-H, J-N, P-R, 0-9)")
    .transform(val => val.toUpperCase()),
  mileage: z.string()
    .min(1, "Mileage is required")
    .regex(/^\d+$/, "Please enter only numbers")
    .refine(
      (val) => {
        const num = parseInt(val);
        return num > 0 && num < 1000000;
      },
      "Mileage must be between 0 and 1,000,000 km"
    )
    .transform(val => val.replace(/[^0-9]/g, '')),
  gearbox: z.enum(["manual", "automatic"], {
    required_error: "Please select a transmission type",
    invalid_type_error: "Invalid transmission type",
  }),
});

export type ValuationFormData = z.infer<typeof valuationFormSchema>;
