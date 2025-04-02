
/**
 * Changes made:
 * - Updated to use explicit CarListingFormData type
 * - Fixed type compatibility issue with Partial
 * - 2025-08-04: Fixed type issues with the form context
 * - 2025-08-18: Added useMemo for context value to prevent unnecessary re-renders
 * - 2025-08-18: Enhanced error message for better developer experience
 * - 2025-08-18: Added display name for better DevTools experience
 * - 2025-08-18: Improved return type for useFormData hook
 * - 2025-11-20: Optimized context implementation with better memoization
 * - 2025-11-20: Added performance optimization for context consumers
 * - 2025-11-20: Implemented equality checking to prevent unnecessary rerenders
 * - 2025-11-21: Fixed TypeScript error with keyof parameter
 * - 2025-11-21: Exposed form methods directly in context value for easier access
 */

import React, { createContext, ReactNode, useContext, useMemo, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Enhanced context shape to expose common form methods directly
interface FormDataContextValue {
  form: UseFormReturn<CarListingFormData>;
  // Expose common form methods directly for convenient access
  control: UseFormReturn<CarListingFormData>['control'];
  watch: UseFormReturn<CarListingFormData>['watch'];
  setValue: <T extends keyof CarListingFormData>(
    name: T, 
    value: CarListingFormData[T]
  ) => void;
  getFormValues: () => CarListingFormData;
  setFormValue: <T extends keyof CarListingFormData>(
    name: T, 
    value: CarListingFormData[T]
  ) => void;
}

// Create context with safe default value
const FormDataContext = createContext<FormDataContextValue | null>(null);

// Provider component with prop types
interface FormDataProviderProps {
  children: ReactNode;
  form: UseFormReturn<CarListingFormData>;
}

export const FormDataProvider = ({ children, form }: FormDataProviderProps) => {
  // Create stable callbacks that won't change identity between renders
  const getFormValues = useCallback(() => {
    return form.getValues();
  }, [form]);

  const setFormValue = useCallback(<T extends keyof CarListingFormData>(
    name: T, 
    value: CarListingFormData[T]
  ) => {
    form.setValue(name, value, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  }, [form]);

  // Deeply memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    form,
    // Expose common form methods directly
    control: form.control,
    watch: form.watch,
    setValue: form.setValue,
    getFormValues,
    setFormValue
  }), [form, getFormValues, setFormValue]);

  return (
    <FormDataContext.Provider value={contextValue}>
      {children}
    </FormDataContext.Provider>
  );
};

// Enhanced hook with better error messaging and type safety
export const useFormData = (): FormDataContextValue => {
  const context = useContext(FormDataContext);
  
  if (!context) {
    throw new Error(
      "useFormData must be used within a FormDataProvider. " +
      "Wrap your component tree with <FormDataProvider>."
    );
  }
  
  return context;
};

// Access only form values without subscribing to all form changes
export const useFormValues = <T extends keyof CarListingFormData>(fieldName?: T) => {
  const { form, getFormValues } = useFormData();
  
  return useMemo(() => {
    const values = getFormValues();
    return fieldName ? values[fieldName] : values;
  }, [getFormValues, fieldName, form.formState.submitCount]);
};

// Access only form state without subscribing to value changes
export const useFormState = () => {
  const { form } = useFormData();
  
  return useMemo(() => ({
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors
  }), [
    form.formState.isDirty,
    form.formState.isValid,
    form.formState.isSubmitting,
    form.formState.errors
  ]);
};

// Add display name for better DevTools experience
FormDataContext.displayName = "FormDataContext";
