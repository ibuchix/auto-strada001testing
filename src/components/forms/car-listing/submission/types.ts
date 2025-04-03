
import { ReactNode } from "react";
import { TransactionStatus } from "@/services/supabase/transactions/types";
import { CarListingFormData } from "@/types/forms";

export interface FormSubmissionProviderProps {
  children: ReactNode;
  userId?: string;
}

export interface FormSubmissionContextType {
  isSubmitting: boolean;
  error: string | null;
  transactionStatus: TransactionStatus | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (value: boolean) => void;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<any>;
  resetTransaction: () => void;
}

export interface SubmissionErrorType {
  message: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
