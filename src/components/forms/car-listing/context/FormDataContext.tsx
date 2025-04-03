
/**
 * Form Data Context
 * - Provides form data and methods throughout the form components
 * - Resolves TypeScript errors with form prop passing
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
        formState: form.formState
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
