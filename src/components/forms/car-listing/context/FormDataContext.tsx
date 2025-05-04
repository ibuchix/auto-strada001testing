
/**
 * Form Data Context
 * Created: 2025-05-12
 * Updated: 2025-05-06 - Enhanced context to include isSubmitting state
 * Updated: 2025-05-15 - Added safety checks for form availability and error handling
 * Purpose: Provides form context for car listing forms
 */

import React, { createContext, useContext, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface FormDataContextValue {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  isFormReady: boolean;
}

const FormDataContext = createContext<FormDataContextValue | undefined>(undefined);

export const FormDataProvider: React.FC<{
  children: React.ReactNode;
  form: UseFormReturn<any>;
}> = ({ children, form }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormReady = !!form && !!form.register;
  
  // Safety check to ensure form is properly initialized before rendering children
  if (!isFormReady) {
    console.error("FormDataProvider: Form is not properly initialized");
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>Error: Form context not properly initialized</p>
      </div>
    );
  }
  
  return (
    <FormDataContext.Provider value={{
      form,
      isSubmitting,
      setIsSubmitting,
      isFormReady
    }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = (): FormDataContextValue => {
  const context = useContext(FormDataContext);
  
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  
  return context;
};

// Safe version that doesn't throw errors, returns null if context is unavailable
export const useSafeFormData = (): FormDataContextValue | null => {
  try {
    return useContext(FormDataContext) || null;
  } catch (error) {
    console.error("Error accessing form context:", error);
    return null;
  }
};
