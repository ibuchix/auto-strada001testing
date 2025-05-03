
/**
 * Form Data Context
 * Created: 2025-06-17
 * 
 * Context to provide form data and form control across components
 */

import { createContext, useContext, ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

interface FormDataContextType {
  form: UseFormReturn<CarListingFormData>;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export function useFormData(): FormDataContextType {
  const context = useContext(FormDataContext);
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
}

interface FormDataProviderProps {
  form: UseFormReturn<CarListingFormData>;
  children: ReactNode;
}

export function FormDataProvider({ form, children }: FormDataProviderProps) {
  return (
    <FormDataContext.Provider value={{ form }}>
      {children}
    </FormDataContext.Provider>
  );
}
