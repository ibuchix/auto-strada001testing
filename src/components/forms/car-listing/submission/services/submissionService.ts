
/**
 * Changes made:
 * - 2024-06-12: Created dedicated service for form submission
 * - 2024-07-24: Enhanced handling of valuation data with improved validation
 * - 2024-07-28: Improved mileage validation with better fallback mechanisms
 */

import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { prepareCarDataForSubmission } from "../utils/dataPreparation";
import { validateValuationData, validateMileageData } from "../utils/validationHandler";
import { SubmissionErrorType } from "../types";

export const submitCarListing = async (
  formData: CarListingFormData, 
  userId: string,
  carId?: string
) => {
  console.log('Starting car listing submission process');
  
  try {
    // Validate required data first with enhanced validation
    console.log('Validating mileage data...');
    const mileage = validateMileageData();
    console.log('Mileage validated successfully:', mileage);
    
    console.log('Validating valuation data...');
    const valuationData = validateValuationData();
    console.log('Valuation data validated successfully');
    
    // Ensure mileage is consistent in valuationData
    if (valuationData.mileage === undefined || valuationData.mileage === null) {
      valuationData.mileage = mileage;
      console.log('Updated valuation data with validated mileage:', mileage);
      
      // Store the updated valuation data
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
    }
    
    console.log('Validation successful, preparing data for submission');
    
    // Prepare data for submission
    const carData = await prepareCarDataForSubmission(
      formData,
      carId,
      userId,
      valuationData
    );
    
    console.log('Data prepared, submitting to database');
    
    // Submit to database
    const { data, error } = await supabase
      .from('cars')
      .upsert(carData)
      .select();
    
    if (error) {
      console.error('Database error during submission:', error);
      throw error;
    }
    
    console.log('Submission successful:', data);
    return data?.[0]?.id;
    
  } catch (error: any) {
    console.error('Submission error:', error);
    
    // Format error appropriately
    if (error.message && typeof error.message === 'string') {
      throw {
        message: error.message,
        description: "There was an error submitting your listing. Please try again or contact support if the issue persists.",
        action: {
          label: "Try Again",
          onClick: () => window.location.reload()
        }
      } as SubmissionErrorType;
    }
    
    // If it's already a SubmissionErrorType, just rethrow
    if (error.message && error.description) {
      throw error;
    }
    
    // Fallback generic error
    throw {
      message: "Submission Failed",
      description: error.message || "An unexpected error occurred while submitting your listing.",
      action: {
        label: "Try Again",
        onClick: () => window.location.reload()
      }
    } as SubmissionErrorType;
  }
};
