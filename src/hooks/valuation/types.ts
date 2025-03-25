
/**
 * Changes made:
 * - 2024-12-20: Created valuation types file extracted from useValuationForm
 */

import { ValuationFormData } from "@/types/validation";

export interface UseValuationFormResult {
  form: any;
  isLoading: boolean;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  valuationResult: any;
  onSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
}

export interface UseValuationRequestProps {
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  setIsLoading: (loading: boolean) => void;
}

export interface UseValuationStateProps {
  initialState?: {
    isLoading?: boolean;
    showDialog?: boolean;
    valuationResult?: any;
  };
}
