
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form saving utilities
 * - 2024-03-19: Added data transformation and validation
 * - 2024-03-19: Implemented error handling for save operations
 * - 2024-09-02: Enhanced error handling and added retry mechanism
 * - 2024-10-17: Added security definer function approach for reliable saving
 * - 2025-04-28: Fixed TypeScript errors with RPC types and return values
 * - 2025-05-01: Fixed TypeScript errors with RPC function name and return type casting
 * - 2025-05-16: Fixed TypeScript type errors for RPC function using "as any" casting
 * - 2025-08-04: Updated to use seller_name field instead of name
 * - 2025-05-30: Enhanced field handling to include both name and seller_name fields
 *   for maximum compatibility with the security definer function
 * - 2025-05-31: Applied consistent field mapping strategy across all transformations
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field has_documentation
 * - 2025-06-10: Added schema validation to catch field mismatches during development
 * - 2027-11-05: Enhanced schema validation with detailed logging and timing metrics
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
      console.log('Preparing car data for save operation...');
      const carData = prepareCarData(formData, valuationData, userId);
      
      // Only include carId in the upsert if it's defined
      const dataToUpsert = carId ? { ...carData, id: carId } : carData;

      // Enhanced logging for debugging
      console.log('Attempting to save car data with fields:', 
        Object.keys(dataToUpsert).filter(key => 
          key === 'name' || key === 'seller_name'
        ).reduce((obj, key) => ({...obj, [key]: dataToUpsert[key]}), {})
      );

      // Run schema validation in development mode to catch mismatches early
      console.log('Running schema validation before save...');
      const validationStartTime = performance.now();
      const validationIssues = await validateFormSchema(dataToUpsert, 'cars');
      const validationEndTime = performance.now();
      
      console.log(`Schema validation completed in ${(validationEndTime - validationStartTime).toFixed(2)}ms`);
      
      if (validationIssues.length > 0) {
        console.warn(`Found ${validationIssues.length} schema validation issues:`, validationIssues);
      } else {
        console.log('Schema validation passed successfully');
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
      
      console.log('Auto-save successful via standard approach');
      return { 
        success: true, 
        carId: data?.[0]?.id || carId 
      };
    } catch (error: any) {
      console.error('Save error:', error);
      
      // If we haven't reached max retries, try again
      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying save operation (attempt ${retries} of ${maxRetries})...`);
        
        // Exponential backoff: wait longer between each retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        return saveOperation();
      }
      
      return { 
        success: false, 
        error: error 
      };
    }
  };
  
  const result = await saveOperation();
  const endTime = performance.now();
  
  console.log(`Save operation completed in ${(endTime - startTime).toFixed(2)}ms with result:`, 
    result.success ? 'Success' : 'Failure');
  
  if (!result.success) {
    // Only show toast for final failure after retries
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
      .single();
      
    if (error || !data) return null;
    
    return data.id;
  } catch (error) {
    console.error('Error checking for existing draft:', error);
    return null;
  }
};
