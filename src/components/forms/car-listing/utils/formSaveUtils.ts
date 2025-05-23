
/**
 * Form save utilities
 * Created: 2025-06-05
 * Updated: 2025-05-23: Removed is_draft system, all saves create immediately available listings
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";

/**
 * Clears the form save cache for a specific user and car
 */
export const clearSaveCache = (userId: string, carId?: string) => {
  try {
    // Clear localStorage cache keys related to this form
    const keyPrefix = `form_save_${userId}_${carId || 'new'}`;
    
    // Find and remove all keys with this prefix
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(keyPrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log(`Cache cleared for user ${userId}, car ${carId || 'new'}`);
    return true;
  } catch (error) {
    console.error("Error clearing save cache:", error);
    return false;
  }
};

/**
 * Prepares form data for saving by cleaning up unnecessary fields
 */
export const prepareFormDataForSave = (data: CarListingFormData): Partial<CarListingFormData> => {
  // Create a copy to avoid mutating the original
  const formData = { ...data };
  
  // Remove any client-side only fields that shouldn't be saved
  delete (formData as any).tempData;
  delete (formData as any).validationErrors;
  
  return formData;
};

/**
 * Saves form data to the database - all listings are immediately available
 */
export const saveFormData = async (
  formData: CarListingFormData, 
  userId: string, 
  valuationData?: any, 
  carId?: string
): Promise<{ success: boolean; carId?: string; error?: any }> => {
  try {
    // Ensure we have a valid user ID
    if (!userId) {
      throw new Error('User ID is required to save form data');
    }

    // Set last_saved timestamp
    const now = new Date();
    
    // Prepare data for saving
    const formDataForSave = prepareFormDataForSave(formData);
    
    // Convert camelCase form data to snake_case for the database
    const dbData = transformObjectToSnakeCase(formDataForSave);
    
    // Add additional fields needed for the database in snake_case format
    const saveData = {
      ...dbData,
      seller_id: userId,
      status: 'available', // Always immediately available
      // Add last_saved timestamp
      last_saved: now.toISOString(),
      // Add valuation data if available - already in snake_case format
      valuation_data: valuationData || formData.valuationData || null,
      // Make sure to add current timestamp for updated_at
      updated_at: now.toISOString()
    };

    // Save to database
    const { data, error } = await supabase
      .from('cars')
      .upsert({
        ...(carId ? { id: carId } : {}),
        ...saveData
      })
      .select('id')
      .single();

    // Handle error
    if (error) {
      console.error('Error saving form data:', error);
      return { 
        success: false,
        error
      };
    }

    // Return success with car ID
    return { 
      success: true, 
      carId: data?.id
    };
  } catch (error) {
    console.error('Exception saving form data:', error);
    return {
      success: false,
      error
    };
  }
};
