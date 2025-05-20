
/**
 * Utility functions for handling form saving
 * Created: 2025-05-30
 * Updated: 2025-05-31 - Fixed TypeScript errors with field naming
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Debounces a function
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number,
): ((...args: Parameters<F>) => Promise<ReturnType<F>>) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};

/**
 * Serializes form data for storage
 */
export const serializeFormData = (data: Partial<CarListingFormData>): string => {
  return JSON.stringify(data);
};

/**
 * Deserializes stored form data
 */
export const deserializeFormData = (serializedData: string): Partial<CarListingFormData> => {
  try {
    return JSON.parse(serializedData) as Partial<CarListingFormData>;
  } catch (error) {
    console.error('Error deserializing form data:', error);
    return {};
  }
};

/**
 * Adds metadata to form data
 */
export const addFormMetadata = (
  data: Partial<CarListingFormData>,
  step: number
): Partial<CarListingFormData> => {
  const now = new Date().toISOString();
  
  return {
    ...data,
    formMetadata: {
      ...data.formMetadata,
      lastSaved: now,
      step,
    },
  };
};

/**
 * Loads draft data from localStorage
 */
export const loadFormDraft = (): Partial<CarListingFormData> | null => {
  try {
    const serializedData = localStorage.getItem('carListingDraft');
    if (!serializedData) return null;
    
    const data = deserializeFormData(serializedData);
    
    // Use camelCase for valuationData
    if (data.valuationData) {
      data.valuationData = data.valuationData;
    }
    
    return data;
  } catch (error) {
    console.error('Error loading form draft:', error);
    return null;
  }
};
