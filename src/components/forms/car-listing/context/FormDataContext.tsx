
/**
 * Form Data Context Provider
 * Created: 2025-05-03
 * 
 * Provides form data to components through React context
 */

import React, { createContext, useContext, ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface FormDataContextType {
  form: UseFormReturn<CarListingFormData>;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

interface FormDataProviderProps {
  form: UseFormReturn<CarListingFormData>;
  children: ReactNode;
}

export const FormDataProvider: React.FC<FormDataProviderProps> = ({ form, children }) => {
  return (
    <FormDataContext.Provider value={{ form }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = (): FormDataContextType => {
  const context = useContext(FormDataContext);
  
  if (context === undefined) {
    throw new Error("useFormData must be used within a FormDataProvider");
  }
  
  return context;
};
