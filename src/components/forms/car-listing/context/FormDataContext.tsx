
/**
 * FormDataContext
 * Created: 2025-06-15
 * 
 * Context for sharing form data across components
 */

import React, { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

interface FormDataContextType {
  form: UseFormReturn<CarListingFormData>;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export const FormDataProvider: React.FC<{
  children: React.ReactNode;
  form: UseFormReturn<CarListingFormData>;
}> = ({ children, form }) => {
  return (
    <FormDataContext.Provider value={{ form }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};
