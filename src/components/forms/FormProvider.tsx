
/**
 * Changes made:
 * - Created FormProvider for sharing form state between components
 * - Added form validation context
 * - Enhanced form submission handling
 * - Improved type safety with TypeScript
 */

import React, { createContext, useContext, ReactNode } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

// Create a generic form context type
type FormContextType<T extends FieldValues> = {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
};

// Create a context with undefined initial value
const FormContext = createContext<FormContextType<any> | undefined>(undefined);

// Props for the FormProvider component
interface FormProviderProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting?: boolean;
  children: ReactNode;
}

// Generic FormProvider component
export function FormProvider<T extends FieldValues>({
  form,
  isSubmitting = false,
  children
}: FormProviderProps<T>) {
  return (
    <FormContext.Provider value={{ form, isSubmitting }}>
      {children}
    </FormContext.Provider>
  );
}

// Hook to use the form context
export function useFormContext<T extends FieldValues>() {
  const context = useContext(FormContext);
  
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  
  return context as FormContextType<T>;
}
