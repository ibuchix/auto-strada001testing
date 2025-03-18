
/**
 * Changes made:
 * - 2024-06-07: Created FormSubmissionProvider component to handle context
 * - 2024-10-22: Fixed missing TransactionStatus import and type issues
 * - 2024-10-23: Removed redundant FormSubmissionContextType interface
 */

import { createContext, useContext } from "react";
import { FormSubmissionContextType, FormSubmissionProviderProps } from "./types";
import { useFormSubmission } from "./useFormSubmission";

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
