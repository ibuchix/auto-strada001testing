
/**
 * Utilities for form save operations
 * Created during refactoring of useFormPersistence.ts
 */

import { CarListingFormData } from "@/types/forms";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { saveFormData } from "../../utils/formSaveUtils";

// 24 hours cache TTL
const CACHE_TTL = 86400000;

/**
 * Saves form data to both local cache and remote database
 */
export const saveProgress = async (
  formData: CarListingFormData,
  userId: string,
  currentStep: number,
  carId?: string,
  abortController?: AbortController
): Promise<{ success: boolean; carId?: string; error?: any }> => {
  if (!userId) return { success: false };

  try {
    // Add metadata about form state
    const enhancedFormData = {
      ...formData,
      form_metadata: {
        ...formData.form_metadata,
        currentStep,
        lastSavedAt: new Date().toISOString()
      }
    };
    
    // Save key form fields to local storage for offline recovery
    saveToCache(CACHE_KEYS.TEMP_VIN, formData.vin || '', CACHE_TTL);
    saveToCache(CACHE_KEYS.TEMP_MILEAGE, formData.mileage?.toString() || '', CACHE_TTL);
    saveToCache(CACHE_KEYS.TEMP_GEARBOX, formData.transmission || '', CACHE_TTL);

    // Optimistic local cache update with TTL
    saveToCache(CACHE_KEYS.TEMP_FORM_DATA, enhancedFormData, CACHE_TTL);
    saveToCache(CACHE_KEYS.FORM_STEP, currentStep.toString(), CACHE_TTL);

    // If we're offline, just save to cache and return success
    if (abortController?.signal.aborted) {
      throw new Error('AbortError');
    }

    // Call the saveFormData function to save to database
    const result = await saveFormData(
      enhancedFormData,
      userId,
      formData.valuation_data || {},
      carId
    );
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to save draft');
    }
    
    return {
      success: true,
      carId: result.carId
    };
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'AbortError') {
      return { success: false, error: new Error('Save aborted') };
    }
    
    console.error('Save failed:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Determines if form data has changed compared to last saved data
 */
export const hasFormDataChanged = (
  currentData: string,
  lastSavedData: string
): boolean => {
  return currentData !== lastSavedData;
};

/**
 * Serializes form data for comparison, excluding metadata fields
 */
export const serializeFormData = (formData: CarListingFormData): string => {
  return JSON.stringify({
    ...formData,
    // Exclude fields that change but don't need saves
    form_metadata: undefined,
    updated_at: undefined
  });
};
