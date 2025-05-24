
/**
 * Form save utilities
 * Created: 2025-06-05
 * Updated: 2025-05-24: COMPLETELY REMOVED DRAFT LOGIC - All saves create immediately available listings
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";

/**
 * Clears the form save cache for a specific user and car
 */
export const clearSaveCache = (userId: string, carId?: string) => {
  try {
    const keyPrefix = `form_save_${userId}_${carId || 'new'}`;
    
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
  const formData = { ...data };
  
  // Remove any client-side only fields that shouldn't be saved
  delete (formData as any).tempData;
  delete (formData as any).validationErrors;
  
  return formData;
};

/**
 * Saves form data to the database - ALWAYS immediately available
 */
export const saveFormData = async (
  formData: CarListingFormData, 
  userId: string, 
  valuationData?: any, 
  carId?: string
): Promise<{ success: boolean; carId?: string; error?: any }> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to save form data');
    }

    const now = new Date();
    
    const formDataForSave = prepareFormDataForSave(formData);
    
    // Convert camelCase form data to snake_case for the database
    const dbData = transformObjectToSnakeCase(formDataForSave);
    
    // Add additional fields needed for the database - ALWAYS AVAILABLE
    const saveData = {
      ...dbData,
      seller_id: userId,
      status: 'available', // ALWAYS available
      is_draft: false, // NEVER draft
      last_saved: now.toISOString(),
      valuation_data: valuationData || formData.valuationData || null,
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

    if (error) {
      console.error('Error saving form data:', error);
      return { 
        success: false,
        error
      };
    }

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
