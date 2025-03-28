
/**
 * Changes made:
 * - 2024-06-12: Created dedicated service for form submission
 * - 2024-07-24: Enhanced handling of valuation data with improved validation
 * - 2024-07-28: Improved mileage validation with better fallback mechanisms
 * - 2024-07-30: Added timeout handling and better error recovery
 * - 2024-08-01: Fixed TypeScript error with car_id property access
 * - 2025-07-21: Added enhanced error handling to prevent blank screen issues
 * - 2025-08-25: Integrated prepareSubmission for cleaner data transformation
 * - 2025-12-01: Updated to use the new error architecture
 * - 2024-08-17: Refactored to use standardized timeout utilities
 */

import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { prepareCarDataForSubmission } from "../utils/dataPreparation";
import { validateValuationData, validateMileageData } from "../utils/validationHandler";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { prepareSubmission } from "../../utils/submission";
import { createTimeoutError, createSubmissionError, createNetworkError } from "@/errors/factory";
import { SubmissionErrorCode } from "@/errors/types";
import { TimeoutDurations, withTimeout } from "@/utils/timeoutUtils";

export const submitCarListing = async (
  formData: CarListingFormData, 
  userId: string,
  carId?: string
) => {
  console.log('Starting car listing submission process');
  
  try {
    // Use the new withTimeout utility for cleaner timeout handling
    return await withTimeout(
      performSubmission(formData, userId, carId),
      TimeoutDurations.EXTENDED,
      "Submission timed out after 30 seconds"
    );
  } catch (error: any) {
    console.error('Submission error:', error);
    
    // Handle timeout-specific errors
    if (error.message && error.message.includes('timed out')) {
      toast.error("Submission timed out", {
        description: "Please try again. If the problem persists, contact support."
      });
      
      throw createTimeoutError("Submission Timeout", {
        description: "The operation took too long to complete. Please try again.",
        timeout: TimeoutDurations.EXTENDED
      });
    }
    
    // Handle other errors and rethrow
    handleSubmissionError(error);
    throw error;
  }
};

// Extract the core submission logic to a separate function
async function performSubmission(
  formData: CarListingFormData, 
  userId: string,
  carId?: string
) {
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
  
  try {
    // Try using the RPC function first for more reliable submission
    console.log('Trying submission via RPC function');
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_car_listing' as any,
      { p_car_data: carData }
    );
    
    if (!rpcError && rpcResult) {
      console.log('Submission via RPC function successful:', rpcResult);
      // Safely access car_id with proper type checking
      if (typeof rpcResult === 'object' && rpcResult !== null && 'car_id' in rpcResult) {
        return rpcResult.car_id as string;
      }
      return carId; // Fallback to existing carId if car_id not found in result
    }
    
    console.log('RPC function failed, falling back to direct upsert', rpcError);
    // Fall back to direct upsert
  } catch (rpcException) {
    console.error('RPC function call failed with exception:', rpcException);
    // Continue with fallback
  }
  
  // Fallback: Submit to database via direct upsert
  const result = await supabase
    .from('cars')
    .upsert(carData)
    .select();
  
  const data = result.data;
  const error = result.error;
  
  if (error) {
    console.error('Database error during submission:', error);
    throw createSubmissionError(
      "Database error during submission", 
      {
        code: SubmissionErrorCode.DATABASE_ERROR,
        description: error.message || "Failed to save your listing data.",
        retryable: true
      }
    );
  }
  
  console.log('Submission successful:', data);
  return data?.[0]?.id;
}

// Helper function to handle submission errors
function handleSubmissionError(error: any) {
  // If it's already one of our error types, just rethrow
  if (error.name === 'ValidationError' || 
      error.name === 'SubmissionError' ||
      error.name === 'BaseApplicationError') {
    throw error;
  }
  
  // Check for network-related errors
  if (error.message && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline')
    )) {
    throw createNetworkError(
      "Network connection issue",
      { 
        description: "Please check your internet connection and try again.",
        retryAction: () => window.location.reload()
      }
    );
  }
  
  // Format error appropriately for unknown errors
  throw createSubmissionError(
    error.message || "Submission Failed", 
    {
      code: SubmissionErrorCode.UNKNOWN,
      description: "An unexpected error occurred while submitting your listing.",
      retryable: true
    }
  );
}
