
/**
 * Changes made:
 * - Updated to use explicit CarListingFormData type
 * - Fixed type compatibility issue with Partial
 * - 2025-08-04: Fixed type issues with the form context
 * - 2025-08-18: Added useMemo for context value to prevent unnecessary re-renders
 * - 2025-08-18: Enhanced error message for better developer experience
 * - 2025-08-18: Added display name for better DevTools experience
 * - 2025-08-18: Improved return type for useFormData hook
 */

import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Strongly type the context shape
interface FormDataContextValue {
  form: UseFormReturn<CarListingFormData>;
}

// Create context with safe default value
const FormDataContext = createContext<FormDataContextValue | null>(null);

// Provider component with prop types
interface FormDataProviderProps {
  children: ReactNode;
  form: UseFormReturn<CarListingFormData>;
}

export const FormDataProvider = ({ children, form }: FormDataProviderProps) => {
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ form }), [form]);

  return (
    <FormDataContext.Provider value={contextValue}>
      {children}
    </FormDataContext.Provider>
  );
};

// Custom hook with enhanced type safety
export const useFormData = (): UseFormReturn<CarListingFormData> => {
  const context = useContext(FormDataContext);
  
  if (!context) {
    throw new Error(
      "useFormData must be used within a FormDataProvider. " +
      "Wrap your component tree with <FormDataProvider>."
    );
  }
  
  return context.form;
};

// Optional: Add display name for better DevTools experience
FormDataContext.displayName = "FormDataContext";
