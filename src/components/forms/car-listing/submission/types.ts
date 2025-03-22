
import { CarListingFormData } from "@/types/forms";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { ReactNode } from "react";

export type SubmissionErrorType = {
  message: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export interface FormSubmissionContextType {
  submitting: boolean;
  error: any;
  transactionStatus: TransactionStatus | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (show: boolean) => void;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<any>;
  resetTransaction?: () => void;  // Added reset functionality
}

export interface FormSubmissionProviderProps {
  children: ReactNode;
  userId?: string;
}
