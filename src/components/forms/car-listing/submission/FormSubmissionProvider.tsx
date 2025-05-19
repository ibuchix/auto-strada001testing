
/**
 * Form Submission Provider
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed naming conflict, file name typo, and added isSuccessful flag
 * Updated: 2025-05-26 - Fixed context implementation to use car-listing specific FormStateContext
 * Updated: 2025-05-19 - Fixed throttling issues and enhanced error feedback
 * Updated: 2025-05-20 - Enhanced with cooldown tracking and consolidated throttling logic
 * 
 * Provides consistent submission handling with proper type handling
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { CarListingFormData } from '@/types/forms';
import { useFormSubmission as useFormSubmissionHook } from '@/hooks/useFormSubmission';

interface FormSubmissionContextType {
  submissionState: {
    isSubmitting: boolean;
    submitError: string | null;
    isSuccessful?: boolean;
    cooldownTimeRemaining?: number;
  };
  submitForm: (data: CarListingFormData) => Promise<string | null>;
  resetSubmissionState: () => void;
}

export const FormSubmissionContext = createContext<FormSubmissionContextType | undefined>(undefined);

export const useFormSubmission = () => {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error('useFormSubmission must be used within a FormSubmissionProvider');
  }
  return context;
};

interface FormSubmissionProviderProps {
  children: ReactNode;
  formId?: string;
  userId: string;
}

export const FormSubmissionProvider = ({ 
  children, 
  formId = 'default',
  userId
}: FormSubmissionProviderProps) => {
  const { 
    submitForm: baseSubmitForm, 
    isSubmitting, 
    submitError, 
    resetSubmitError,
    cooldownTimeRemaining
  } = useFormSubmissionHook(formId);

  const [isSuccessful, setIsSuccessful] = useState(false);
  
  // Submit form with consistent return type
  const submitForm = async (data: CarListingFormData): Promise<string | null> => {
    setIsSuccessful(false);
    
    const result = await baseSubmitForm(data);
    
    // Set success state based on result
    if (result) {
      setIsSuccessful(true);
    }
    
    return result;
  };
  
  // Reset submission state
  const resetSubmissionState = () => {
    resetSubmitError();
    setIsSuccessful(false);
  };
  
  const value = {
    submissionState: {
      isSubmitting,
      submitError,
      isSuccessful,
      cooldownTimeRemaining
    },
    submitForm,
    resetSubmissionState
  };
  
  return (
    <FormSubmissionContext.Provider value={value}>
      {children}
    </FormSubmissionContext.Provider>
  );
};

// Export an alias for backward compatibility
export const useFormSubmissionContext = useFormSubmission;
