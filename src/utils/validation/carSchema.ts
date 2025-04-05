
/**
 * Validation schema for car listings
 * Added photo validation requirements
 */
import { z } from "zod";

export const carSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number()
    .int("Year must be a whole number")
    .min(1886, "Year must be 1886 or later") // First automobile
    .max(new Date().getFullYear() + 1, "Year cannot be more than 1 year in the future"),
  price: z.number()
    .min(100, "Price must be at least 100")
    .max(10000000, "Price exceeds maximum allowed value"),
  mileage: z.number()
    .nonnegative("Mileage cannot be negative"),
  vin: z.string()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "VIN must be 17 characters and contain only valid characters"),
  transmission: z.enum(["manual", "automatic"], {
    errorMap: () => ({ message: "Transmission must be either manual or automatic" })
  }),
  photoValidationPassed: z.boolean().optional().default(false),
  uploadedPhotos: z.array(z.string()).min(3, "At least 3 photos are required")
});

export type CarSchema = z.infer<typeof carSchema>;

// Validation function to check if all required photos are present
export const validateRequiredPhotos = (formData: Partial<CarSchema>): boolean => {
  return !!formData.photoValidationPassed;
};
