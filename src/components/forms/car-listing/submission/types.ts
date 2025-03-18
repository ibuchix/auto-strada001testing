
/**
 * Changes made:
 * - 2024-06-07: Created types file for form submission functionality
 * - 2024-10-22: Added missing TransactionStatus type import
 */

import { CarListingFormData } from "@/types/forms";
import { TransactionStatus } from "@/services/supabase/transactionService";

export type FormSubmissionContextType = {
  submitting: boolean;
  error: string | null;
  transactionStatus?: TransactionStatus | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (show: boolean) => void;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<any>;
};

export type FormSubmissionProviderProps = {
  children: React.ReactNode;
  userId?: string;
};

export type SubmissionErrorType = {
  code?: string;
  message: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};
