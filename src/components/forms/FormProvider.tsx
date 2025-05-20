
/**
 * Changes made:
 * - Created FormProvider for sharing form state between components
 * - Added form validation context
 * - Enhanced form submission handling
 * - Improved type safety with TypeScript
 * - Added better error handling for missing context
 * - Added debug logging for context issues
 */

import React, { createContext, useContext, ReactNode, useEffect } from "react";
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
  debugName?: string;
}

// Generic FormProvider component
export function FormProvider<T extends FieldValues>({
  form,
  isSubmitting = false,
  children,
  debugName = "unnamed"
}: FormProviderProps<T>) {
  // Add debug logging on mount
  useEffect(() => {
    console.log(`FormProvider [${debugName}] initialized with form:`, 
      form ? "Valid form object" : "Missing form object"
    );
  }, [form, debugName]);

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
    console.error("useFormContext: Must be used within a FormProvider. This error may appear if multiple form providers are nested incorrectly.");
    throw new Error("useFormContext must be used within a FormProvider");
  }
  
  return context as FormContextType<T>;
}

// Error-tolerant version that returns null instead of throwing
export function useSafeFormContext<T extends FieldValues>() {
  const context = useContext(FormContext);
  return context as FormContextType<T> | undefined;
}
