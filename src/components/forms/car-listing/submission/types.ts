
import { CarListingFormData } from "@/types/forms";

export type FormSubmissionContextType = {
  submitting: boolean;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (show: boolean) => void;
  handleSubmit: (data: CarListingFormData, carId?: string) => Promise<void>;
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
