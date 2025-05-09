
/**
 * Form save utilities
 * Created: 2025-06-05
 * Updated: 2025-06-06: Added saveFormData function and improved error handling
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";

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
 * Saves form data to the database
 * Returns a promise that resolves to an object with success flag, car ID, and error if any
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

    // Prepare data for saving
    const saveData = {
      ...prepareFormDataForSave(formData),
      seller_id: userId,
      is_draft: true,
      // Add valuation data if available
      valuation_data: valuationData || formData.valuation_data || null,
      // Make sure to add current timestamp for updated_at
      updated_at: new Date().toISOString()
    };

    // Determine if we're creating or updating
    const isNew = !carId;

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
