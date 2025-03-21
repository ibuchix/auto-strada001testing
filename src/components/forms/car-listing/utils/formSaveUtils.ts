
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form saving utilities
 * - 2024-03-19: Added data transformation and validation
 * - 2024-03-19: Implemented error handling for save operations
 * - 2024-09-02: Enhanced error handling and added retry mechanism
 * - 2024-10-17: Added security definer function approach for reliable saving
 * - 2025-04-28: Fixed TypeScript errors with RPC types and return values
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { prepareCarData } from "./carDataTransformer";

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
  
  const saveOperation = async (): Promise<{ success: boolean; carId?: string; error?: any }> => {
    try {
      const carData = prepareCarData(formData, valuationData, userId);
      
      // Only include carId in the upsert if it's defined
      const dataToUpsert = carId ? { ...carData, id: carId } : carData;

      // Try using the security definer function first (most reliable method)
      try {
        console.log('Attempting save via security definer function');
        
        // Cast the return type appropriately to handle the response
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'create_car_listing',
          { p_car_data: dataToUpsert }
        );
        
        if (!rpcError && rpcResult && typeof rpcResult === 'object' && 'success' in rpcResult) {
          console.log('Auto-save successful via security definer function', rpcResult);
          return { 
            success: true, 
            carId: rpcResult.car_id || carId 
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
