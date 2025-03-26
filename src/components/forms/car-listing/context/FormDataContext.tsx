
/**
 * Changes made:
 * - 2028-07-14: Created FormDataContext for sharing form data between components
 */

import { createContext, useContext, ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

type FormDataContextType = {
  form: UseFormReturn<CarListingFormData>;
};

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export function useFormData() {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error("useFormData must be used within a FormDataProvider");
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
