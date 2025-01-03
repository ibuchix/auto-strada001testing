import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { transformCarDataForSubmission } from "./carDataTransformer";

export const handleFormSubmission = async (
  data: CarListingFormData,
  userId: string,
  valuationData: any,
  carId?: string
) => {
  try {
    const transformedData = transformCarDataForSubmission(data, userId, valuationData);

    if (carId) {
      const { error } = await supabase
        .from('cars')
        .update(transformedData)
        .eq('id', carId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cars')
        .insert(transformedData);

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