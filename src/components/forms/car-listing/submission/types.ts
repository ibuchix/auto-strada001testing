
import { ReactNode } from "react";
import { TransactionStatus } from "../types";
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
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<void>;
  resetTransaction: () => void;
  carId?: string;
  setCarId: (id: string) => void;
  setTransactionStatus: (status: TransactionStatus) => void;
  updateTransactionStatus: (status: TransactionStatus, error: Error | null) => void;
}

export interface SubmissionErrorType {
  message: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
