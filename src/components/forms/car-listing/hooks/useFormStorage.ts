
/**
 * Form storage hook for saving form data
 * Created: 2025-07-12
 * Updated: 2025-07-23 - Added support for draft loading and error handling
 * Updated: 2025-05-22 - Fixed TypeScript compatibility with Supabase Json types
 */

import { useState, useCallback } from 'react';
import { CarListingFormData } from '@/types/forms';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppError, DatabaseError } from '@/errors/AppError';
import { toSupabaseObject, ensureDateString } from '@/utils/supabaseTypeUtils';

export const useFormStorage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // Save form data to local storage
  const saveFormDataLocal = useCallback((formData: CarListingFormData): boolean => {
    try {
      localStorage.setItem('car_form_data', JSON.stringify(formData));
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  }, []);
  
  // Save form data to the database
  const saveFormData = useCallback(async (formData: CarListingFormData): Promise<boolean> => {
    try {
      setIsSaving(true);
      
      // First save to local storage as a backup
      saveFormDataLocal(formData);
      
      // If we have a car ID, try to save to the database
      if (formData.id) {
        // Convert form data to Supabase-compatible format
        const supabaseData = toSupabaseObject({
          ...formData,
          updated_at: new Date().toISOString(),
          created_at: ensureDateString(formData.created_at),
          is_draft: true
        });
        
        const { error } = await supabase
          .from('cars')
          .update(supabaseData)
          .eq('id', formData.id);
        
        if (error) {
          console.error("Error saving to database:", error);
          toast.error("Failed to save to database");
          return false;
        }
      }
      
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error("Error saving form data:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [saveFormDataLocal]);
  
  // Load form data from local storage
  const loadFormDataLocal = useCallback((): CarListingFormData | null => {
    try {
      const savedData = localStorage.getItem('car_form_data');
      if (savedData) {
        return JSON.parse(savedData);
      }
      return null;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return null;
    }
  }, []);
  
  // Load form data from the database
  const loadFormData = useCallback(async (carId: string): Promise<CarListingFormData | null> => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .maybeSingle();
      
      if (error) {
        throw new DatabaseError(`Failed to load draft: ${error.message}`);
      }
      
      if (!data) {
        throw new AppError(`No draft found with ID: ${carId}`);
      }
      
      // Save to local storage as backup
      localStorage.setItem('car_form_data', JSON.stringify(data));
      
      return data as unknown as CarListingFormData;
    } catch (error) {
      console.error("Error loading form data:", error);
      setLoadError(error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Clear form data from local storage
  const clearLocalFormData = useCallback(() => {
    try {
      localStorage.removeItem('car_form_data');
      return true;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return false;
    }
  }, []);
  
  return {
    saveFormData,
    saveFormDataLocal,
    loadFormDataLocal,
    loadFormData,
    clearLocalFormData,
    isSaving,
    isLoading,
    lastSaved,
    loadError
  };
};
