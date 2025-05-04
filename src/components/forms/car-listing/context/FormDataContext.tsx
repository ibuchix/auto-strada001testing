
/**
 * Form Data Context
 * Created: 2025-05-12
 * Updated: 2025-05-06 - Enhanced context to include isSubmitting state
 * Purpose: Provides form context for car listing forms
 */

import React, { createContext, useContext, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface FormDataContextValue {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

const FormDataContext = createContext<FormDataContextValue | undefined>(undefined);

export const FormDataProvider: React.FC<{
  children: React.ReactNode;
  form: UseFormReturn<any>;
}> = ({ children, form }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  return (
    <FormDataContext.Provider value={{
      form,
      isSubmitting,
      setIsSubmitting,
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
