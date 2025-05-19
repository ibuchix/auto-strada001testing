
/**
 * Form Submitter Hook
 * Created: 2025-05-20
 * 
 * Handles the actual database submission of form data
 */

import { useCallback } from 'react';
import { CarListingFormData } from '@/types/forms';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

type SubmitResult = {
  data: any[] | null;
  error: Error | null;
};

export const useFormSubmitter = () => {
  const supabase = useSupabaseClient();
  
  const submitToDatabase = useCallback(async (formData: CarListingFormData): Promise<SubmitResult> => {
    try {
      // Handle case with existing car ID (edit) vs. new car (create)
      if (formData.id) {
        // Update existing car
        const { data, error } = await supabase
          .from('cars')
          .update(formData)
          .eq('id', formData.id)
          .select();
        
        if (error) throw new Error(error.message);
        
        return {
          data,
          error: null
        };
      } else {
        // Insert new car
        const { data, error } = await supabase
          .from('cars')
          .insert(formData)
          .select();
        
        if (error) throw new Error(error.message);
        
        return {
          data,
          error: null
        };
      }
    } catch (error) {
      console.error('Error submitting form to database:', error);
      
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown database error')
      };
    }
  }, [supabase]);
  
  return {
    submitToDatabase
  };
};
