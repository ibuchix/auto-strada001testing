
/**
 * Changes made:
 * - Updated to use explicit CarListingFormData type
 * - Fixed type compatibility issue with Partial
 */

import React, { createContext, ReactNode, useContext } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Create context with type compatibility
interface FormDataContextType {
  form: UseFormReturn<CarListingFormData>;
}

const FormDataContext = createContext<FormDataContextType | null>(null);

// Provider component
interface FormDataProviderProps {
  children: ReactNode;
  form: UseFormReturn<CarListingFormData>;
}

export const FormDataProvider = ({ children, form }: FormDataProviderProps) => {
  return (
    <FormDataContext.Provider value={{ form }}>
      {children}
    </FormDataContext.Provider>
  );
};

// Hook to use the form context
export const useFormData = () => {
  const context = useContext(FormDataContext);
  
  if (!context) {
    throw new Error("useFormData must be used within a FormDataProvider");
  }
  
  return context;
};
