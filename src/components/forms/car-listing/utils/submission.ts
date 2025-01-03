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
    const transformedData = prepareCarData(data, valuationData, userId);

    if (carId) {
      const { error } = await supabase
        .from('cars')
        .update({ ...transformedData, is_draft: false })
        .eq('id', carId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cars')
        .insert({ ...transformedData, is_draft: false });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Submission error:', error);
    return { 
      success: false, 
      error: error.message || "Failed to submit listing" 
    };
  }
};