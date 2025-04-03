
/**
 * Form Data Context
 * - Provides form data and methods throughout the form components
 * - Resolves TypeScript errors with form prop passing
 * - Updated to expose common form methods directly for easier access
 */
import React, { createContext, useContext, ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface FormDataContextType {
  form: UseFormReturn<CarListingFormData>;
  formState: {
    isDirty: boolean;
    isSubmitting: boolean;
    isValid: boolean;
  };
  // Add direct access to common form methods
  control: UseFormReturn<CarListingFormData>["control"];
  watch: UseFormReturn<CarListingFormData>["watch"];
  setValue: UseFormReturn<CarListingFormData>["setValue"];
  getValues: UseFormReturn<CarListingFormData>["getValues"];
  trigger: UseFormReturn<CarListingFormData>["trigger"];
  clearErrors: UseFormReturn<CarListingFormData>["clearErrors"];
  setError: UseFormReturn<CarListingFormData>["setError"];
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export const FormDataProvider = ({
  children,
  form
}: {
  children: ReactNode;
  form: UseFormReturn<CarListingFormData>;
}) => {
  return (
    <FormDataContext.Provider
      value={{
        form,
        formState: form.formState,
        // Expose form methods directly
        control: form.control,
        watch: form.watch.bind(form),
        setValue: form.setValue.bind(form),
        getValues: form.getValues.bind(form),
        trigger: form.trigger.bind(form),
        clearErrors: form.clearErrors.bind(form),
        setError: form.setError.bind(form),
      }}
    >
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (context === undefined) {
    throw new Error("useFormData must be used within a FormDataProvider");
  }
  return context;
};
