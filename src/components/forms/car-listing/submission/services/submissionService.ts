
/**
 * Changes made:
 * - 2024-06-12: Created dedicated service for form submission
 * - 2024-07-24: Enhanced handling of valuation data with improved validation
 * - 2024-07-28: Improved mileage validation with better fallback mechanisms
 * - 2024-07-30: Added timeout handling and better error recovery
 * - 2024-08-01: Fixed TypeScript error with car_id property access
 * - 2025-07-21: Added enhanced error handling to prevent blank screen issues
 */

import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { prepareCarDataForSubmission } from "../utils/dataPreparation";
import { validateValuationData, validateMileageData } from "../utils/validationHandler";
import { SubmissionErrorType } from "../types";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const submitCarListing = async (
  formData: CarListingFormData, 
  userId: string,
  carId?: string
) => {
  console.log('Starting car listing submission process');
  
  try {
    // Set up submission timeout
    const submissionTimeout = setTimeout(() => {
      console.error('Submission operation timed out after 20 seconds');
      throw {
        message: "Submission Timeout",
        description: "The operation took too long to complete. Please try again.",
        action: {
          label: "Try Again",
          onClick: () => window.location.reload()
        }
      } as SubmissionErrorType;
    }, 20000);
    
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
      
      try {
        // Try using the RPC function first for more reliable submission
        let data;
        let error;
        
        try {
          console.log('Trying submission via RPC function');
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'create_car_listing' as any,
            { p_car_data: carData }
          );
          
          if (!rpcError && rpcResult) {
            // Clear the timeout since operation succeeded
            clearTimeout(submissionTimeout);
            
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
        
        data = result.data;
        error = result.error;
        
        if (error) {
          console.error('Database error during submission:', error);
          throw error;
        }
        
        // Clear the timeout since operation succeeded
        clearTimeout(submissionTimeout);
        
        console.log('Submission successful:', data);
        return data?.[0]?.id;
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        
        // Show user-friendly error
        toast.error("Database operation failed", {
          description: "We had trouble saving your listing. Please try again.",
          duration: 5000
        });
        
        // Make sure we navigate away to prevent being stuck
        setTimeout(() => {
          if (window.location.pathname.includes('sell-my-car')) {
            window.location.href = '/dashboard/seller';
          }
        }, 5000);
        
        throw dbError;
      }
      
    } catch (innerError) {
      // Clear the timeout since we're handling the error
      clearTimeout(submissionTimeout);
      throw innerError;
    }
    
  } catch (error: any) {
    console.error('Submission error:', error);
    
    // Format error appropriately
    if (error.message && typeof error.message === 'string') {
      // Make sure we don't stay on a blank page
      setTimeout(() => {
        if (window.location.pathname.includes('sell-my-car') && !document.body.textContent) {
          console.log('Detected possible blank page, redirecting to dashboard');
          window.location.href = '/dashboard/seller';
        }
      }, 3000);
      
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
