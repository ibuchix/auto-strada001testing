/**
 * Changes made:
 * - Reduced verbosity of console logging
 * - Added more targeted diagnostic logging
 * - Maintained key performance and error tracking information
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { prepareCarData } from "./carDataTransformer";
import { validateFormSchema } from "@/utils/validation/schemaValidation";

/**
 * Saves form data to Supabase with robust error handling and retry mechanism
 */
export const saveFormData = async (
  formData: CarListingFormData,
  userId: string,
  valuationData: any,
  carId?: string,
  maxRetries = 2
): Promise<{ success: boolean; carId?: string; error?: any }> => {
  let retries = 0;
  const startTime = performance.now();
  
  const saveOperation = async (): Promise<{ success: boolean; carId?: string; error?: any }> => {
    try {
      const carData = prepareCarData(formData, valuationData, userId);
      
      const dataToUpsert = carId ? { ...carData, id: carId } : carData;

      // Minimal logging with environment check
      if (process.env.NODE_ENV === 'development') {
        console.log('Preparing car data for save', {
          sellerId: userId,
          hasCarId: !!carId
        });
      }

      // Optional schema validation with minimal logging
      try {
        const schemaIssues = await validateFormSchema(dataToUpsert, 'cars');
        
        if (schemaIssues.length > 0 && process.env.NODE_ENV === 'development') {
          console.warn(`${schemaIssues.length} schema validation issues detected`);
        }
      } catch (validationError) {
        console.warn('Schema validation encountered an error', validationError);
      }

      // Try using the security definer function first (most reliable method)
      try {
        console.log('Attempting save via security definer function');
        
        // Cast the function name and result as any to bypass TypeScript's strict checking
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'create_car_listing' as any,
          { p_car_data: dataToUpsert }
        );
        
        if (!rpcError && rpcResult) {
          console.log('Auto-save successful via security definer function', rpcResult);
          
          // Extract the car_id from the result with proper type safety
          const resultObj = rpcResult as any;
          
          return { 
            success: true, 
            carId: resultObj.car_id ? String(resultObj.car_id) : carId
          };
        }
        
        console.warn('Security definer function failed, falling back to standard approach:', rpcError);
      } catch (rpcException) {
        console.warn('Exception calling security definer function:', rpcException);
      }

      // Fallback to standard approach
      const { data, error } = await supabase
        .from('cars')
        .upsert(dataToUpsert)
        .select();

      if (error) throw error;
      
      const endTime = performance.now();
      console.log(`Save operation completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      return { 
        success: true, 
        carId: data?.[0]?.id || carId 
      };
    } catch (error: any) {
      // Targeted error logging
      console.error('Save operation failed', {
        errorMessage: error.message,
        retryCount: retries
      });
      
      // Retry logic remains the same
      const isTransientError = 
        error.code === 'TIMEOUT' || 
        error.code === '503' || 
        error.message?.includes('timeout') || 
        error.message?.includes('network');
      
      if (retries < maxRetries && (isTransientError || retries === 0)) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        return saveOperation();
      }
      
      return { 
        success: false, 
        error: error 
      };
    }
  };
  
  const result = await saveOperation();
  
  if (!result.success) {
    toast.error(result.error.message || 'Failed to save changes', {
      description: "Your changes will be saved locally until connectivity is restored",
      duration: 5000,
    });
  }
  
  return result;
};

/**
 * Checks if a draft exists for the current user
 */
export const checkForExistingDraft = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('id')
      .eq('seller_id', userId)
      .eq('is_draft', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error || !data) return null;
    
    return data.id;
  } catch (error) {
    console.error('Error checking for existing draft:', error);
    return null;
  }
};
