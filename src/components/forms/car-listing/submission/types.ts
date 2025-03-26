
import { ReactNode } from "react";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { CarListingFormData } from "@/types/forms";

export interface FormSubmissionProviderProps {
  children: ReactNode;
  userId?: string;
}

export interface FormSubmissionContextType {
  submitting: boolean;
  error: string | null;
  transactionStatus: TransactionStatus | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (value: boolean) => void;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<any>;
  resetTransaction: () => void;  // Add resetTransaction to context type
}

export interface SubmissionErrorType {
  message: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
