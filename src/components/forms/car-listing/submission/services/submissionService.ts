
/**
 * Car Listing Submission Service
 * Created: 2025-06-07
 * 
 * Service to handle car listing form submissions
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";
import { toast } from "sonner";

interface SubmissionResult {
  id: string;
  success: boolean;
  message?: string;
}

/**
 * Submits a car listing form to the database
 * 
 * @param formData The form data to submit
 * @param userId The ID of the user submitting the form
 * @returns A promise that resolves to a SubmissionResult object
 */
export const submitCarListing = async (
  formData: CarListingFormData,
  userId: string
): Promise<SubmissionResult> => {
  try {
    console.log('[SubmissionService] Starting submission process');
    
    // Validate required fields are present
    if (!formData.make || !formData.model || !formData.year) {
      throw new Error('Missing required fields');
    }
    
    // Ensure we have a valid user ID
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Transform form data to snake_case for database compatibility
    const dbData = transformObjectToSnakeCase({
      ...formData,
      sellerId: userId,
      status: 'pending', // Change from draft to pending for submission
      isDraft: false,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Submit to database
    const { data, error } = await supabase
      .from('cars')
      .upsert({
        ...(formData.id ? { id: formData.id } : {}),
        ...dbData
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SubmissionService] Database error:', error);
      throw new Error(`Submission failed: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('No ID returned from submission');
    }

    console.log('[SubmissionService] Submission successful:', data.id);
    return {
      id: data.id,
      success: true,
      message: 'Car listing submitted successfully'
    };
  } catch (error) {
    console.error('[SubmissionService] Submission error:', error);
    
    // Show error notification
    toast.error('Submission failed', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    
    // Re-throw for handling by the caller
    throw error;
  }
};
