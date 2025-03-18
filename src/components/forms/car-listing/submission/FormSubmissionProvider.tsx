/**
 * Changes made:
 * - 2024-06-07: Created FormSubmissionProvider component to handle context
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

export interface FormSubmissionContextType {
  submitting: boolean;
  error: string | null;
  transactionStatus?: TransactionStatus | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (show: boolean) => void;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<any>;
}
