
/**
 * Changes made:
 * - 2024-06-07: Created FormSubmissionProvider component to handle context
 * - 2024-10-22: Fixed missing TransactionStatus import and type issues
 */

import { createContext, useContext } from "react";
import { FormSubmissionContextType, FormSubmissionProviderProps } from "./types";
import { useFormSubmission } from "./useFormSubmission";
import { CarListingFormData } from "@/types/forms";
import { TransactionStatus } from "@/services/supabase/transactionService";

const FormSubmissionContext = createContext<FormSubmissionContextType | null>(null);

export const useFormSubmissionContext = () => {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error("useFormSubmissionContext must be used within a FormSubmissionProvider");
  }
  return context;
};

export const FormSubmissionProvider = ({ children, userId }: FormSubmissionProviderProps) => {
  const {
    submitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit
  } = useFormSubmission(userId);

  return (
    <FormSubmissionContext.Provider
      value={{
        submitting,
        error,
        transactionStatus,
        showSuccessDialog,
        setShowSuccessDialog,
        handleSubmit
      }}
    >
      {children}
    </FormSubmissionContext.Provider>
  );
};

// Define the extended FormSubmissionContextType interface
export interface FormSubmissionContextType {
  submitting: boolean;
  error: string | null;
  transactionStatus?: TransactionStatus | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (show: boolean) => void;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<any>;
}
