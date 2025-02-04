import { z } from "zod";

export const valuationFormSchema = z.object({
  vin: z.string()
    .length(17, "VIN must be exactly 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Please enter a valid VIN number"),
  mileage: z.string()
    .min(1, "Mileage is required")
    .regex(/^\d+$/, "Please enter a valid number")
    .refine(
      (val) => {
        const num = parseInt(val);
        return num > 0 && num < 1000000;
      },
      "Mileage must be between 0 and 1,000,000 km"
    ),
  gearbox: z.enum(["manual", "automatic"], {
    required_error: "Please select a transmission type",
  }),
});

export type ValuationFormData = z.infer<typeof valuationFormSchema>;