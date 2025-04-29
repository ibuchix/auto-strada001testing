
/**
 * Types for valuation hooks
 * Created: 2025-04-30
 */

import { UseFormReturn } from "react-hook-form";
import { ValuationFormData } from "@/types/validation";

export interface UseValuationStateResult {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  valuationResult: any | null;
  setValuationResult: (result: any | null) => void;
  resetState: () => void;
}

export interface UseValuationFormResult {
  form: UseFormReturn<ValuationFormData>;
  isLoading: boolean;
  showDialog: boolean;
  setShowDialog: (open: boolean) => void;
  valuationResult: any | null;
  onSubmit: (data: ValuationFormData) => void;
  resetForm: () => void;
}
