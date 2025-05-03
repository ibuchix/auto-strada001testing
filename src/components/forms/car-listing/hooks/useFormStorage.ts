
/**
 * Hook for form storage operations
 * Created: 2025-07-02
 */

import { useCallback } from 'react';
import { CarListingFormData } from '@/types/forms';
import { supabase } from '@/integrations/supabase/client';

export const useFormStorage = () => {
  // Save form data to localStorage
  const saveFormData = useCallback(async (data: CarListingFormData) => {
    try {
      localStorage.setItem('car_form_data', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save form data to localStorage:', error);
      return false;
    }
  }, []);

  // Load form data from localStorage
  const loadFormData = useCallback(() => {
    try {
      const savedData = localStorage.getItem('car_form_data');
      if (savedData) {
        return JSON.parse(savedData) as CarListingFormData;
      }
    } catch (error) {
      console.error('Failed to load form data from localStorage:', error);
    }
    return null;
  }, []);

  // Save draft to Supabase
  const saveDraft = useCallback(async (data: CarListingFormData, userId: string) => {
    try {
      const { data: savedData, error } = await supabase
        .from('car_drafts')
        .upsert({
          ...data,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return savedData.id;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return null;
    }
  }, []);

  return {
    saveFormData,
    loadFormData,
    saveDraft,
  };
};
