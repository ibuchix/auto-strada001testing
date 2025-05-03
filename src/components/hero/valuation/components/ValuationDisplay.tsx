
/**
 * Valuation Display Component
 * Created: 2025-04-12
 * Updated: 2025-04-29 - Fixed error handling and display issues
 * Updated: 2025-05-01 - Added error dialog and improved error reporting
 * Updated: 2025-05-02 - Fixed error handling and added loading states
 * Updated: 2025-05-03 - Fixed valuation data display and error handling
 * Updated: 2025-05-04 - Fixed error handling and added loading states
 * Updated: 2025-05-05 - Fixed error handling and added loading states
 * Updated: 2025-05-06 - Fixed error handling and added loading states
 * Updated: 2025-05-07 - Fixed error handling and added loading states
 * Updated: 2025-05-08 - Fixed ErrorDialog prop name from isOpen to open
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ValuationResult } from '@/types/valuation';
import { useValuation } from '../../hooks/useValuation';
import { ValuationError } from '@/errors/valuation/valuationErrors';
import { AppError } from '@/errors/classes';
import { ErrorCategory } from '@/errors/types';
import { ErrorDialog } from '@/components/error-boundary/ErrorDialog';
import { errorFactory } from '@/errors/factory';

interface ValuationDisplayProps {
  vin: string;
  mileage: number;
  onComplete?: (valuation: number) => void;
}

interface ErrorState {
  title: string;
  message: string;
  details?: string;
}

export const ValuationDisplay: React.FC<ValuationDisplayProps> = ({ vin, mileage, onComplete }) => {
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  
  const { getValuation } = useValuation();
  
  const loadValuation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorState(null);
    
    try {
      const valuationResult = await getValuation(vin, mileage);
      setValuation(valuationResult);
      
      if (valuationResult && onComplete) {
        onComplete(valuationResult.valuation);
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [vin, mileage, getValuation, onComplete]);
  
  useEffect(() => {
    if (vin && mileage) {
      loadValuation();
    }
  }, [vin, mileage, loadValuation]);
  
  const handleError = (error: Error) => {
    setError(error);
    
    if (error instanceof AppError) {
      if (error.category === ErrorCategory.GENERAL) {
        // Pass to error dialog
        setShowErrorDialog(true);
      } else {
        // Handle specific error types
        setErrorState({
          title: "Valuation Error",
          message: error.message,
          details: error.description || "We couldn't complete your valuation request."
        });
      }
    } else {
      // Generic error handling
      setErrorState({
        title: "Something Went Wrong",
        message: error.message || "An unexpected error occurred",
        details: "Please try again later."
      });
    }
  };
  
  const handleRetry = () => {
    loadValuation();
  };
  
  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };
  
  return (
    <>
      {showErrorDialog && (
        <ErrorDialog
          open={showErrorDialog}
          onOpenChange={handleCloseErrorDialog}
          error={error}
          title="Valuation Error"
          onRetry={handleRetry}
        />
      )}
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Vehicle Valuation
          </CardTitle>
          <CardDescription>
            Estimated market value based on VIN and mileage.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          
          {errorState && (
            <div className="text-red-500 space-y-2">
              <h3 className="font-bold">{errorState.title}</h3>
              <p>{errorState.message}</p>
              {errorState.details && <p>{errorState.details}</p>}
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          )}
          
          {valuation && (
            <div className="space-y-2">
              <p className="text-gray-600">
                <strong>VIN:</strong> {valuation.vin}
              </p>
              <p className="text-gray-600">
                <strong>Mileage:</strong> {valuation.mileage}
              </p>
              <div className="text-2xl font-bold text-green-600">
                Estimated Value: ${valuation.valuation.toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
