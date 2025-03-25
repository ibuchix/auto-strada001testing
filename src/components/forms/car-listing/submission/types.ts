
/**
 * Changes made:
 * - 2027-07-25: Updated FormSubmissionContextType to match implementation
 */

import { Dispatch, ReactNode, SetStateAction } from "react";
import { CarListingFormData } from "@/types/forms";
import { TransactionStatus } from "@/services/supabase/transactionService";

export interface FormSubmissionContextType {
  submitting: boolean;
  error: string | null;
  transactionStatus: TransactionStatus | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<any>;
  resetTransaction: () => void;
}

export interface FormSubmissionProviderProps {
  children: ReactNode;
  userId?: string;
}

export type SubmissionErrorType = {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};
