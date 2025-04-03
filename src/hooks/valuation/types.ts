
/**
 * Types for valuation hooks
 * Created: 2024-04-03
 * Updated: 2024-04-04 - Added missing types
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
  [key: string]: any;
}

export interface ValuationRequestConfig {
  requestId?: string;
  timeout?: number;
  withCache?: boolean;
}

export interface UseValuationStateProps {
  initialState?: {
    isLoading?: boolean;
    showDialog?: boolean;
    valuationResult?: any;
  };
}

export interface UseValuationFormResult {
  form: any;
  isLoading: boolean;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  valuationResult: any;
  onSubmit: (e: any) => void;
  resetForm: () => void;
}
