
/**
 * Types for valuation hooks
 * Created: 2025-04-30
 * Updated: 2025-05-10 - Added new hook types
 * Updated: 2025-05-15 - Fixed form submission handler types
 * Updated: 2025-05-16 - Fixed mileage type to be consistent (string)
 * Updated: 2025-05-17 - Ensured consistent typing for ValuationFormData interface
 */

import { UseFormReturn } from "react-hook-form";

export interface ValuationFormData {
  vin?: string;
  mileage?: string;
  gearbox?: "manual" | "automatic";
}

export interface UseValuationStateResult {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  showDialog: boolean;
  setShowDialog: (open: boolean) => void;
  valuationResult: any | null;
  setValuationResult: (result: any | null) => void;
  retryCount: number;
  setRetryCount: (count: number) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  resetState: () => void;
}

export interface UseValuationFormResult {
  form: UseFormReturn<ValuationFormData>;
  isLoading: boolean;
  showDialog: boolean;
  setShowDialog: (open: boolean) => void;
  valuationResult: any | null;
  onSubmit: (data: ValuationFormData) => Promise<void>; // Clear signature for submission handler
  resetForm: () => void;
}

export interface UseValuationRequestResult {
  executeRequest: (vin: string, mileage: string, gearbox: string) => Promise<any>;
  isLoading: boolean;
  requestId: string;
  cleanup: () => void;
}
