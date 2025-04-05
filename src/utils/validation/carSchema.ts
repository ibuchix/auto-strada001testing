
/**
 * Validation schema for car listings
 * Added photo validation requirements
 * Added extended car validation functions
 * 2025-11-29: Fixed type compatibility with CarListingFormData
 */
import { z } from "zod";
import { CarListingFormData } from "@/types/forms";

// Base car schema for core validation
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

// Extended schema for complete car validation
export const extendedCarSchema = carSchema.extend({
  // Additional fields from CarListingFormData
  features: z.any().optional(), // Allow any for features object
  damageReports: z.array(z.any()).optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  mobileNumber: z.string().optional(),
  isDamaged: z.boolean().optional(),
  isRegisteredInPoland: z.boolean().optional(),
  isSellingOnBehalf: z.boolean().optional(),
  hasPrivatePlate: z.boolean().optional(),
  numberOfKeys: z.string().optional(),
  serviceHistoryType: z.string().optional(),
  
  // Other optional fields
  notes: z.string().optional(),
  description: z.string().optional(),
  userId: z.string().optional(),
  seller_id: z.string().optional(),
  // Allow any other fields
}).passthrough();

// Type alias for the basic car schema
export type CarSchema = z.infer<typeof carSchema>;

// Type alias for the extended car schema
export type ExtendedCarSchema = z.infer<typeof extendedCarSchema>;

// Validation function to check if all required photos are present
export const validateRequiredPhotos = (formData: Partial<CarSchema>): boolean => {
  return !!formData.photoValidationPassed;
};

// Full validation function for car data
export const validateCar = (data: any) => {
  return carSchema.safeParse(data);
};

// Extended validation for complete car form data
export const validateExtendedCar = (data: Partial<CarListingFormData>) => {
  return extendedCarSchema.safeParse(data);
};
