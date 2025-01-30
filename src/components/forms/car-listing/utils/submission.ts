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
    console.log('Starting form submission process...');
    
    // Validate valuation data first
    if (!valuationData || !valuationData.make || !valuationData.model || !valuationData.vin || 
        !valuationData.mileage || !valuationData.valuation || !valuationData.year) {
      throw new Error("Please complete the vehicle valuation first");
    }

    // Check if VIN already exists (for non-draft listings)
    console.log('Checking for existing VIN...');
    const { data: existingCar, error: checkError } = await supabase
      .from('cars')
      .select('id, title')
      .eq('vin', valuationData.vin)
      .eq('is_draft', false)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking VIN:', checkError);
      throw checkError;
    }

    if (existingCar) {
      return { 
        success: false, 
        error: "This vehicle has already been listed. Each vehicle can only be listed once." 
      };
    }

    console.log('Transforming car data...');
    const transformedData = prepareCarData(data, valuationData, userId);

    console.log('Submitting to database...');
    if (carId) {
      const { error } = await supabase
        .from('cars')
        .update({ ...transformedData, is_draft: false })
        .eq('id', carId)
        .single();

      if (error) {
        console.error('Error updating car:', error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('cars')
        .insert({ ...transformedData, is_draft: false })
        .single();

      if (error) {
        console.error('Error inserting car:', error);
        if (error.code === '23505') { // Unique violation error code
          return { 
            success: false, 
            error: "This vehicle has already been listed. Each vehicle can only be listed once." 
          };
        }
        throw error;
      }
    }

    console.log('Form submission completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Submission error:', error);
    
    if (error.message?.includes('timeout') || error.code === 'TIMEOUT_ERROR') {
      throw new Error('The request timed out. Please check your connection and try again.');
    }
    
    return { 
      success: false, 
      error: error.message || "Failed to submit listing" 
    };
  }
};