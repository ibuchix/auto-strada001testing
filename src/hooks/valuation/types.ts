
/**
 * Types for valuation hooks
 * Created: 2025-05-10
 */

import { UseFormReturn } from "react-hook-form";
import { ValuationFormData } from "@/types/validation";

export interface UseValuationFormResult {
  form: UseFormReturn<ValuationFormData>;
  isLoading: boolean;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  valuationResult: any;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  resetForm: () => void;
}

export interface UseValuationStateResult {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  valuationResult: any;
  setValuationResult: (result: any) => void;
  resetState: () => void;
}

export interface ValuationData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  transmission?: string;
  basePrice?: number;
  reservePrice?: number;
  valuation?: number;
  averagePrice?: number;
  price_min?: number;
  price_med?: number;
  error?: string;
}
