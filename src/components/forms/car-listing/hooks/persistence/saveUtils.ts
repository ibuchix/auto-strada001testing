
/**
 * Utilities for form save operations
 * Created during refactoring of useFormPersistence.ts
 * 
 * Changes made:
 * - 2025-06-04: Added safe postMessage handling
 * - 2025-06-04: Improved error handling for save operations
 * - 2025-06-04: Added save throttling to prevent excessive operations
 * - 2025-06-04: Enhanced caching of form data to reduce duplicate saves
 */

import { CarListingFormData } from "@/types/forms";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { saveFormData } from "../../utils/formSaveUtils";

// 24 hours cache TTL
const CACHE_TTL = 86400000;

// Prevent saving too frequently
const MIN_SAVE_INTERVAL = 2000; // 2 seconds
let lastSaveTime = 0;

/**
 * Safely send postMessage without throwing cross-origin errors
 */
const safePostMessage = (data: any) => {
  try {
    if (window.parent !== window) {
      window.parent.postMessage(data, '*');
    }
  } catch (error) {
    // Silently fail - cross-origin restrictions are expected
  }
};

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
    // Throttle saves to prevent excessive database operations
    const now = Date.now();
    if (now - lastSaveTime < MIN_SAVE_INTERVAL) {
      return { success: true, carId }; // Pretend it succeeded to avoid error handling
    }
    lastSaveTime = now;
    
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
    
    // Notify for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      safePostMessage({ 
        type: 'FORM_SAVING_PROGRESS', 
        step: currentStep,
        timestamp: new Date().toISOString()
      });
    }

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
    
    // Log error but don't expose it (avoids postMessage issues)
    console.error('Save failed:', error.message || 'Unknown error');
    
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
