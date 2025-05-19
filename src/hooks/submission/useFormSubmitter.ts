
/**
 * Form Submitter Hook
 * Created: 2025-05-24
 * 
 * Handles the actual database submission operation
 */

import { supabase } from '@/integrations/supabase/client';
import { SubmissionResponseData } from './useDataProcessing';

export const useFormSubmitter = () => {
  const submitToDatabase = async (submissionData: any): Promise<{ data: SubmissionResponseData[] | null, error: any }> => {
    return await supabase
      .from('cars')
      .upsert(submissionData, { 
        onConflict: 'id'
      })
      // Explicitly type the response data
      .returns<SubmissionResponseData[]>();
  };
  
  return {
    submitToDatabase
  };
};
