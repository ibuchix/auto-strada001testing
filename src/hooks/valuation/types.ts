
/**
 * Types for valuation hooks
 * Created: 2024-04-03
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
