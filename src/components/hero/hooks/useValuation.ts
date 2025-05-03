
/**
 * Hook for retrieving vehicle valuations
 * Created: 2025-05-12
 * Purpose: Centralized hook for valuation API access
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { getVehicleValuation } from '@/services/api/valuationService';
import { ValuationResult } from '@/types/valuation';
import { AppError, ValidationError } from '@/errors/classes';
import { ErrorCategory, ErrorCode } from '@/errors/types';

export interface ValuationOptions {
  showToast?: boolean;
  retryCount?: number;
}

export const useValuation = (options: ValuationOptions = {}) => {
  const { showToast = true, retryCount = 1 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const getValuation = async (vin: string, mileage: number): Promise<ValuationResult> => {
    if (!vin) {
      const vinError = new ValidationError("VIN is required for valuation");
      setError(vinError);
      throw vinError;
    }

    if (!mileage && mileage !== 0) {
      const mileageError = new ValidationError("Mileage is required for valuation");
      setError(mileageError);
      throw mileageError;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Convert mileage to string for API call
      const mileageStr = mileage.toString();
      
      // Use default transmission type
      const gearbox = "manual";
      
      const response = await getVehicleValuation(vin, mileageStr, gearbox);
      
      if (!response.success || !response.data) {
        throw new AppError({
          message: response.error || "Failed to get valuation",
          code: ErrorCode.VALUATION_ERROR,
          category: ErrorCategory.BUSINESS
        });
      }
      
      // Create a normalized result
      const valuationResult: ValuationResult = {
        vin,
        mileage,
        valuation: response.data.valuation || 0,
        make: response.data.make || "",
        model: response.data.model || "",
        year: response.data.year || 0,
        apiSource: response.data.apiSource || "auto",
      };
      
      setResult(valuationResult);
      return valuationResult;
    } catch (err) {
      let appError: AppError;
      
      if (err instanceof AppError) {
        appError = err;
      } else if (err instanceof Error) {
        appError = new AppError({
          message: err.message,
          code: ErrorCode.VALUATION_ERROR,
          category: ErrorCategory.BUSINESS
        });
      } else {
        appError = new AppError({
          message: "An unknown error occurred during valuation",
          code: ErrorCode.VALUATION_ERROR,
          category: ErrorCategory.BUSINESS
        });
      }
      
      setError(appError);
      
      if (showToast) {
        toast.error("Valuation failed", {
          description: appError.message
        });
      }
      
      throw appError;
    } finally {
      setIsLoading(false);
    }
  };

  const resetValuation = () => {
    setResult(null);
    setError(null);
  };

  return {
    getValuation,
    resetValuation,
    isLoading,
    result,
    error
  };
};
