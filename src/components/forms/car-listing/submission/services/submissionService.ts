/**
 * Form Submission Service
 * Created: 2025-05-03
 * 
 * Service for submitting car listing form data to the server
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { ValidationError } from "../errors";
import { ErrorCode } from "@/errors/types";

export const submitCarListing = async (
  data: CarListingFormData, 
  userId: string,
  carId?: string
): Promise<{ carId: string; success: boolean }> => {
  try {
    // Prepare submission data
    const submissionData = {
      ...data,
      seller_id: userId,
      updated_at: new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString()
    };
    
    // If we have a car ID, update the existing record
    if (carId) {
      const { error } = await supabase
        .from('cars')
        .update(submissionData)
        .eq('id', carId);
        
      if (error) throw error;
      
      return { carId, success: true };
    }
    
    // Otherwise, insert a new record
    const { data: insertedData, error } = await supabase
      .from('cars')
      .insert(submissionData)
      .select('id')
      .single();
      
    if (error) throw error;
    
    if (!insertedData?.id) {
      throw new Error("Failed to create car listing - no ID returned");
    }
    
    return { carId: insertedData.id, success: true };
  } catch (error: any) {
    console.error("Error submitting car listing:", error);
    
    throw new ValidationError({
      code: ErrorCode.SUBMISSION_ERROR,
      message: "Failed to submit car listing",
      description: error.message || "An error occurred during submission"
    });
  }
};
