
/**
 * Types for valuation hooks
 * Created: 2024-04-03
 * Updated: 2024-04-04 - Added missing types
 * Updated: 2025-04-06 - Fixed ValuationResult and added more interfaces
 */

export interface UseValuationRequestProps {
  onSuccess: (data: any) => void;
  onError: (error: Error) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export interface ValuationData {
  make?: string;
  model?: string;
  year?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  vin?: string;
  mileage?: number;
  transmission?: string;
  error?: string;
  isExisting?: boolean;
  noData?: boolean;
  [key: string]: any;
}

export interface ValuationResult {
  success: boolean;
  data: ValuationData;
}

export interface ValuationRequestConfig {
  requestId?: string;
  timeout?: number;
  withCache?: boolean;
}

export interface UseValuationStateProps {
  initialState?: {
    isLoading?: boolean;
    dialogOpen?: boolean;
    valuationResult?: ValuationResult | null;
  };
}

export interface UseValuationFormResult {
  form: any;
  isLoading: boolean;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  valuationResult: ValuationResult | null;
  onSubmit: (e: any) => void;
  resetForm: () => void;
}
