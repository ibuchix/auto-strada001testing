
/**
 * Form Submission Provider
 * Created: 2025-05-24
 * 
 * Provides consistent submission handling with proper type handling
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { CarListingFormData } from '@/types/forms';
import { useFormSubmission } from '@/hooks/useFormSubmission';

interface FormSubmissionContextType {
  submissionState: {
    isSubmitting: boolean;
    submitError: string | null;
  };
  submitForm: (data: CarListingFormData) => Promise<string | null>;
  resetSubmissionState: () => void;
}

const FormSubmissionContext = createContext<FormSubmissionContextType | undefined>(undefined);

export const useFormSubmission = () => {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error('useFormSubmission must be used within a FormSubmissionProvider');
  }
  return context;
};

interface FormSubmissionProviderProps {
  children: ReactNode;
  formId: string;
}

export const FormSubmissionProvider = ({ 
  children, 
  formId 
}: FormSubmissionProviderProps) => {
  const { 
    submitForm: baseSubmitForm, 
    isSubmitting, 
    submitError, 
    resetSubmitError 
  } = useFormSubmission(formId);
  
  // Submit form with consistent return type
  const submitForm = async (data: CarListingFormData): Promise<string | null> => {
    return baseSubmitForm(data);
  };
  
  // Reset submission state
  const resetSubmissionState = () => {
    resetSubmitError();
  };
  
  const value = {
    submissionState: {
      isSubmitting,
      submitError
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
