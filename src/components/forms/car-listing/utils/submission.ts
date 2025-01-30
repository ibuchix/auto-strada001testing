import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { prepareCarData } from "./carDataTransformer";
import { FormSubmissionResult } from "../types/submission";

export const handleFormSubmission = async (
  data: CarListingFormData,
  userId: string,
  valuationData: any,
  carId?: string
): Promise<FormSubmissionResult> => {
  try {
    // Validate valuation data first
    if (!valuationData || !valuationData.make || !valuationData.model || !valuationData.vin || 
        !valuationData.mileage || !valuationData.valuation || !valuationData.year) {
      throw new Error("Please complete the vehicle valuation first");
    }

    // Check if VIN already exists (for non-draft listings)
    const { data: existingCar, error: checkError } = await supabase
      .from('cars')
      .select('id, title')
      .eq('vin', valuationData.vin)
      .eq('is_draft', false)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingCar) {
      return { 
        success: false, 
        error: "This vehicle has already been listed. Each vehicle can only be listed once." 
      };
    }

    const transformedData = prepareCarData(data, valuationData, userId);

    if (carId) {
      const { error } = await supabase
        .from('cars')
        .update({ ...transformedData, is_draft: false })
        .eq('id', carId)
        .single();

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cars')
        .insert({ ...transformedData, is_draft: false })
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation error code
          return { 
            success: false, 
            error: "This vehicle has already been listed. Each vehicle can only be listed once." 
          };
        }
        throw error;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Submission error:', error);
    
    // Check for timeout-specific errors
    if (error.message?.includes('timeout') || error.code === 'TIMEOUT_ERROR') {
      throw new Error('The request timed out. Please check your connection and try again.');
    }
    
    return { 
      success: false, 
      error: error.message || "Failed to submit listing" 
    };
  }
};