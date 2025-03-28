
/**
 * Server-side validation utilities for car listings
 * This complements client-side validation by providing more secure validation on the server
 */

import { z } from "zod";
import { carSchema } from "@/utils/validation/carSchema";
import { supabase } from "@/integrations/supabase/client";

/**
 * Server-side validation errors response type
 */
export interface ServerValidationResponse {
  success: boolean;
  errors?: string[];
  validated?: Record<string, any>;
}

/**
 * Enhanced server validation schema with additional checks
 */
export const serverCarSchema = carSchema.extend({
  vin: z.string()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "VIN must be 17 characters and contain only valid characters")
    .refine(
      async (vin) => {
        // Check if VIN already exists in database
        const { data, error } = await supabase
          .from('cars')
          .select('id')
          .eq('vin', vin)
          .not('is_draft', 'eq', true)
          .maybeSingle();
        
        return !data; // Return true if VIN does not exist (valid)
      },
      {
        message: "This VIN is already registered in our system"
      }
    ),
  price: z.number()
    .min(100, "Price must be at least 100")
    .refine(
      (price) => price <= 10000000, 
      { message: "Price exceeds maximum allowed value" }
    )
});

/**
 * Validates car listing data on the server side
 * 
 * @param formData - The car listing form data to validate
 * @returns Promise resolving to validation result with any errors
 */
export const validateCarListingServer = async (formData: any): Promise<ServerValidationResponse> => {
  try {
    // Basic sanitization
    const sanitizedData = {
      make: String(formData.make || '').trim(),
      model: String(formData.model || '').trim(),
      year: Number(formData.year || 0),
      price: Number(formData.price || 0),
      mileage: Number(formData.mileage || 0),
      vin: String(formData.vin || '').trim().toUpperCase()
    };

    // Advanced validation with async checks
    const validationResult = await serverCarSchema.safeParseAsync(sanitizedData);
    
    if (!validationResult.success) {
      // Extract error messages from validation result
      const errors = validationResult.error.errors.map(error => 
        `${error.path.join('.')}: ${error.message}`
      );
      
      return {
        success: false,
        errors
      };
    }
    
    // Check additional criteria beyond basic schema validation
    const additionalErrors: string[] = [];
    
    // Validate photos exist
    if (!formData.uploadedPhotos || formData.uploadedPhotos.length === 0) {
      additionalErrors.push("At least one photo is required");
    }
    
    // Validate damage reports if car is damaged
    if (formData.isDamaged && (!formData.damageReports || formData.damageReports.length === 0)) {
      additionalErrors.push("Damage reports are required when car is marked as damaged");
    }
    
    // Return validation result
    if (additionalErrors.length > 0) {
      return {
        success: false,
        errors: additionalErrors
      };
    }
    
    return {
      success: true,
      validated: sanitizedData
    };
  } catch (error) {
    console.error("Server validation error:", error);
    return {
      success: false,
      errors: ["An unexpected error occurred during validation"]
    };
  }
};

/**
 * Utility function to implement server-side throttling for form submissions
 * Prevents abuse of the API
 * 
 * @param userId - The user ID making the request
 * @returns Promise resolving to whether the request should be allowed
 */
export const validateSubmissionRate = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Get recent submissions by this user
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { count, error } = await supabase
      .from('cars')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', userId)
      .gte('created_at', twentyFourHoursAgo.toISOString());
    
    if (error) throw error;
    
    // Limit to 10 submissions per 24 hours
    return (count || 0) < 10;
  } catch (error) {
    console.error("Error checking submission rate:", error);
    // Default to allowing the submission if the check fails
    return true;
  }
};
