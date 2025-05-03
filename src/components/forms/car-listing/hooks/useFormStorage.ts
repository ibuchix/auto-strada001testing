
/**
 * Form storage hook for saving form data
 * Created: 2025-07-12
 */

import { useState } from 'react';
import { CarListingFormData } from '@/types/forms';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFormStorage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Save form data to local storage
  const saveFormDataLocal = (formData: CarListingFormData) => {
    try {
      localStorage.setItem('car_form_data', JSON.stringify(formData));
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  };
  
  // Save form data to the database
  const saveFormData = async (formData: CarListingFormData): Promise<boolean> => {
    try {
      setIsSaving(true);
      
      // First save to local storage as a backup
      saveFormDataLocal(formData);
      
      // If we have a car ID, try to save to the database
      if (formData.id) {
        const { error } = await supabase
          .from('cars')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
            is_draft: true
          })
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
  };
  
  // Load form data from local storage
  const loadFormDataLocal = (): CarListingFormData | null => {
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
  };
  
  return {
    saveFormData,
    saveFormDataLocal,
    loadFormDataLocal,
    isSaving,
    lastSaved
  };
};
