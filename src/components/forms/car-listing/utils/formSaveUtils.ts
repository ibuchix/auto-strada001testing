/**
 * Form save utilities
 * Updated: 2025-04-19 - Updated imports to use new schema validation module structure
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { prepareCarData, prepareCarDataAsync } from "./carDataTransformer";
import { validateFormSchema } from "@/utils/validation/schema";

// Cache last saved data to avoid unnecessary saves
let lastSavedDataCache = new Map<string, string>();

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
  
  // Generate cache key based on userId and carId
  const cacheKey = `${userId}_${carId || 'new'}`;
  
  // Prepare data synchronously first for validation and cache checks
  const initialCarData = prepareCarData(formData, valuationData, userId);
  const currentDataHash = JSON.stringify(initialCarData);
  
  // Check if data has changed since last save
  if (lastSavedDataCache.get(cacheKey) === currentDataHash) {
    console.log('Data unchanged since last save, skipping');
    return { 
      success: true, 
      carId: carId 
    };
  }
  
  const saveOperation = async (): Promise<{ success: boolean; carId?: string; error?: any }> => {
    try {
      // For database insertion, get the most accurate field filtering
      // This is async but ensures best database compatibility
      const carData = await prepareCarDataAsync(formData, valuationData, userId);
      
      // Convert any Date objects to ISO strings to fix type errors
      const dataToUpsert = carId 
        ? { ...convertDatesToISOStrings(carData), id: carId } 
        : convertDatesToISOStrings(carData);

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
        
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'upsert_car_listing',
          { car_data: dataToUpsert }
        );
        
        if (!rpcError && rpcResult) {
          console.log('Auto-save successful via security definer function', rpcResult);
          
          // Update cache with successfully saved data
          lastSavedDataCache.set(cacheKey, currentDataHash);
          
          // Extract the car_id from the result with proper type safety
          const resultObj = rpcResult as any;
          
          return { 
            success: true, 
            carId: resultObj.car_id ? String(resultObj.car_id) : carId
          };
        }
        
        // Check for specific column does not exist error
        if (rpcError && rpcError.message && rpcError.message.includes('column') && rpcError.message.includes('does not exist')) {
          console.warn('Column does not exist error detected:', rpcError.message);
          
          // Try to identify the problematic field
          const match = rpcError.message.match(/column ["']([^"']+)["'] of relation/);
          if (match && match[1]) {
            console.warn(`Problematic field identified: ${match[1]}`);
            
            // Remove the problematic field if found
            if (dataToUpsert[match[1]] !== undefined) {
              console.log(`Removing problematic field ${match[1]} and retrying`);
              delete dataToUpsert[match[1]];
              
              // Retry with modified data
              const { data: retryResult, error: retryError } = await supabase.rpc(
                'upsert_car_listing',
                { car_data: dataToUpsert }
              );
              
              if (!retryError && retryResult) {
                console.log('Auto-save successful after removing problematic field', retryResult);
                
                // Update cache with successfully saved data
                lastSavedDataCache.set(cacheKey, JSON.stringify(dataToUpsert));
                
                const resultObj = retryResult as any;
                return { 
                  success: true, 
                  carId: resultObj.car_id ? String(resultObj.car_id) : carId
                };
              }
            }
          }
        }
        
        console.warn('Security definer function failed, falling back to standard approach:', rpcError);
      } catch (rpcException) {
        console.warn('Exception calling security definer function:', rpcException);
      }

      // Fallback to standard approach - use proper type conversion
      const { data, error } = await supabase
        .from('cars')
        .upsert(dataToUpsert)
        .select();

      if (error) throw error;
      
      const endTime = performance.now();
      console.log(`Save operation completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      // Update cache with successfully saved data
      lastSavedDataCache.set(cacheKey, currentDataHash);
      
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
 * Helper function to convert Date objects to ISO strings
 * This fixes type errors when sending data to Supabase
 */
const convertDatesToISOStrings = (data: Record<string, any>): Record<string, any> => {
  const result = { ...data };
  
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString();
    }
  });
  
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

/**
 * Clear the save cache for a specific user/car
 * Call this when intentionally discarding drafts
 */
export const clearSaveCache = (userId: string, carId?: string) => {
  const cacheKey = `${userId}_${carId || 'new'}`;
  lastSavedDataCache.delete(cacheKey);
  console.log(`Save cache cleared for ${cacheKey}`);
};
