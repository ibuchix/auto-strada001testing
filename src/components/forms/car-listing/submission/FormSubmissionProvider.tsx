
/**
 * Changes made:
 * - 2024-06-07: Created FormSubmissionProvider component to handle context
 * - 2024-10-22: Fixed missing TransactionStatus import and type issues
 * - 2024-10-23: Removed redundant FormSubmissionContextType interface
 * - 2024-07-30: Added transaction reset functionality exposure
 * - 2027-07-30: Enhanced error handling and reset functionality
 * - 2027-07-31: Fixed type mismatch with TransactionStatus
 * - 2025-08-03: Updated to use isSubmitting consistent naming
 */

import { createContext, useContext } from "react";
import { FormSubmissionContextType, FormSubmissionProviderProps } from "./types";
import { useFormSubmission } from "./useFormSubmission";
import { TransactionStatus } from "@/services/supabase/transactions/types";

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
    isSubmitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    resetTransaction
  } = useFormSubmission(userId);

  return (
    <FormSubmissionContext.Provider
      value={{
        isSubmitting,
        error,
        // Ensure we're using the correct type for transactionStatus
        transactionStatus: transactionStatus as TransactionStatus,
        showSuccessDialog,
        setShowSuccessDialog,
        handleSubmit,
        resetTransaction  // Ensure this is exposed to child components
      }}
    >
      {children}
    </FormSubmissionContext.Provider>
  );
};
