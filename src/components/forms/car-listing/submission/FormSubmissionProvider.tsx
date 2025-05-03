
/**
 * Changes made:
 * - 2024-06-07: Created FormSubmissionProvider component to handle context
 * - 2024-10-22: Fixed missing TransactionStatus import and type issues
 * - 2024-10-23: Removed redundant FormSubmissionContextType interface
 * - 2024-07-30: Added transaction reset functionality exposure
 * - 2024-08-14: Enhanced error handling and reset functionality
 * - 2025-04-03: Fixed TypeScript errors with missing properties from useFormSubmission
 * - 2025-04-03: Updated TransactionStatus usage to proper enum values
 * - 2025-06-23: Fixed TransactionStatus import from types
 * - 2025-07-01: Fixed TransactionStatus import issues
 * - 2025-07-22: Exposed FormSubmissionContext and added missing context properties
 */

import { createContext, useContext, useState } from "react";
import { FormSubmissionContextType, FormSubmissionProviderProps } from "./types";
import { useFormSubmission } from "./useFormSubmission";
import { TransactionStatus } from "@/services/supabase/transactions/types";

export const FormSubmissionContext = createContext<FormSubmissionContextType | null>(null);

export const useFormSubmissionContext = () => {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error("useFormSubmissionContext must be used within a FormSubmissionProvider");
  }
  return context;
};

export const FormSubmissionProvider = ({ children, userId }: FormSubmissionProviderProps) => {
  const [carId, setCarId] = useState<string | undefined>(undefined);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const {
    isSubmitting,
    submissionError: error,
    handleSubmit
  } = useFormSubmission(userId ?? "");

  const resetTransaction = () => {
    setTransactionStatus(null);
    setShowSuccessDialog(false);
  };

  const updateTransactionStatus = (status: TransactionStatus, error: Error | null) => {
    setTransactionStatus(status);
    if (status === TransactionStatus.SUCCESS) {
      setShowSuccessDialog(true);
    }
  };

  return (
    <FormSubmissionContext.Provider
      value={{
        isSubmitting,
        error,
        transactionStatus,
        showSuccessDialog,
        setShowSuccessDialog,
        handleSubmit,
        resetTransaction,
        carId,
        setCarId,
        setTransactionStatus,
        updateTransactionStatus
      }}
    >
      {children}
    </FormSubmissionContext.Provider>
  );
};
