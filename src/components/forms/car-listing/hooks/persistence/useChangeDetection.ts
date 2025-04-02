
/**
 * Hook for detecting changes in form data
 * Created during refactoring of useFormPersistence.ts
 */

import { useRef, useCallback } from 'react';
import { CarListingFormData } from '@/types/forms';
import { serializeFormData } from './saveUtils';

export const useChangeDetection = () => {
  const lastSavedDataRef = useRef<string>('');
  
  const setLastSavedData = useCallback((formData: CarListingFormData) => {
    lastSavedDataRef.current = serializeFormData(formData);
  }, []);

  const hasChanges = useCallback((formData: CarListingFormData, carId?: string) => {
    const currentDataString = serializeFormData(formData);
    
    // Always consider it changed if this is a new car (no carId)
    if (!carId) return true;
    
    return currentDataString !== lastSavedDataRef.current;
  }, []);

  return {
    hasChanges,
    setLastSavedData,
    lastSavedDataString: lastSavedDataRef.current
  };
};
