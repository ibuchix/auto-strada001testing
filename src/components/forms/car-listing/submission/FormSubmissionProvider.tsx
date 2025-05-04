
/**
 * Form Submission Provider
 * Created: 2025-07-23
 * Updated: 2025-07-24 - Fixed export of useFormSubmission hook
 * Updated: 2025-05-06 - Improved integration with FormDataContext
 * Updated: 2025-05-13 - Added validation for userId to prevent TypeScript errors
 * Provides context for form submission functionality
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SubmissionError } from './errors';
import { CarListingFormData } from "@/types/forms";
import { useFormData } from '../context/FormDataContext';

// Define the submission context state
interface FormSubmissionState {
  isSubmitting: boolean;
  isSuccessful: boolean;
  error: SubmissionError | null;
  submittedCarId: string | null;
  lastSubmitAttempt: Date | null;
}

// Define the submission context
interface FormSubmissionContextType {
  submissionState: FormSubmissionState;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitSuccess: (carId: string) => void;
  setSubmitError: (error: SubmissionError | Error | string | null) => void;
  resetSubmissionState: () => void;
  submitForm: (formData: CarListingFormData) => Promise<string | null>;
  userId: string;
}

// Create the context with default value
export const FormSubmissionContext = createContext<FormSubmissionContextType | undefined>(undefined);

// Default submission state
const defaultSubmissionState: FormSubmissionState = {
  isSubmitting: false,
  isSuccessful: false,
  error: null,
  submittedCarId: null,
  lastSubmitAttempt: null
};

// Provider component
export const FormSubmissionProvider = ({ 
  children,
  userId
}: { 
  children: ReactNode,
  userId: string
}) => {
  // Validate userId to prevent errors
  if (!userId) {
    console.error("FormSubmissionProvider: userId is required but was not provided");
    throw new Error("FormSubmissionProvider requires a valid userId");
  }
  
  // State for submission
  const [submissionState, setSubmissionState] = useState<FormSubmissionState>(defaultSubmissionState);
  
  // Set submitting state
  const setSubmitting = (isSubmitting: boolean) => {
    setSubmissionState(prev => ({
      ...prev,
      isSubmitting,
      lastSubmitAttempt: isSubmitting ? new Date() : prev.lastSubmitAttempt
    }));
  };
  
  // Set submission success
  const setSubmitSuccess = (carId: string) => {
    setSubmissionState({
      isSubmitting: false,
      isSuccessful: true,
      error: null,
      submittedCarId: carId,
      lastSubmitAttempt: new Date()
    });
  };
  
  // Set submission error
  const setSubmitError = (error: SubmissionError | Error | string | null) => {
    let submissionError: SubmissionError | null = null;
    
    if (error) {
      if (error instanceof SubmissionError) {
        submissionError = error;
      } else if (error instanceof Error) {
        submissionError = new SubmissionError(error.message);
      } else {
        submissionError = new SubmissionError(String(error));
      }
    }
    
    setSubmissionState(prev => ({
      ...prev,
      isSubmitting: false,
      isSuccessful: false,
      error: submissionError
    }));
  };
  
  // Reset submission state
  const resetSubmissionState = () => {
    setSubmissionState(defaultSubmissionState);
  };
  
  // Submit form method - this will be implemented by consuming components
  const submitForm = async (formData: CarListingFormData): Promise<string | null> => {
    try {
      setSubmitting(true);
      // Implementation will be provided by the useFormSubmission hook
      // This is just a placeholder
      return null;
    } catch (error) {
      setSubmitError(error as Error);
      return null;
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <FormSubmissionContext.Provider value={{
      submissionState,
      setSubmitting,
      setSubmitSuccess,
      setSubmitError,
      resetSubmissionState,
      submitForm,
      userId
    }}>
      {children}
    </FormSubmissionContext.Provider>
  );
};

// Hook for consuming components
export const useFormSubmission = () => {
  const context = useContext(FormSubmissionContext);
  
  if (context === undefined) {
    throw new Error('useFormSubmission must be used within a FormSubmissionProvider');
  }
  
  return context;
};

// Alias for backward compatibility
export const useFormSubmissionContext = useFormSubmission;
