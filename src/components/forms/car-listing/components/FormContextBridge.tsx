
/**
 * FormContextBridge Component
 * Created: 2025-05-20
 * 
 * Acts as a bridge between the custom FormDataContext and React Hook Form's FormProvider.
 * Takes the form from custom FormDataContext and wraps children in React Hook Form's FormProvider.
 */

import React from "react";
import { FormProvider } from "react-hook-form";
import { useFormData } from "../context/FormDataContext";

interface FormContextBridgeProps {
  children: React.ReactNode;
}

export const FormContextBridge: React.FC<FormContextBridgeProps> = ({ children }) => {
  // Get the form from our custom FormDataContext
  const { form } = useFormData();
  
  // Wrap children in React Hook Form's FormProvider
  return (
    <FormProvider {...form}>
      {children}
    </FormProvider>
  );
};
