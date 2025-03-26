
/**
 * Error state component for the car listing form
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface ErrorStateProps {
  error: string | null;
  errorType?: string;
  diagnosticId?: string | null;
  from?: string | null;
}

export const ErrorState = ({ error, errorType, diagnosticId, from }: ErrorStateProps) => {
  const navigate = useNavigate();

  const handleNavigateToHome = () => {
    if (diagnosticId) {
      logDiagnostic(
        'NAVIGATE_FROM_ERROR',
        'User navigated from error state to home',
        { error, errorType, from },
        diagnosticId
      );
    }
    navigate('/');
  };

  const handleTryAgain = () => {
    if (diagnosticId) {
      logDiagnostic(
        'ERROR_RETRY',
        'User clicked try again on error state',
        { error, errorType, from },
        diagnosticId
      );
    }
    
    // Clear localStorage and retry
    localStorage.removeItem('valuationData');
    localStorage.removeItem('tempVIN');
    localStorage.removeItem('tempMileage');
    localStorage.removeItem('tempGearbox');
    navigate('/');
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || "There was an issue with loading the form. Please try again."}
        </AlertDescription>
      </Alert>

      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">What would you like to do?</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleTryAgain}
            variant="default"
            className="flex-1"
          >
            Try Again
          </Button>
          
          <Button 
            onClick={handleNavigateToHome} 
            variant="outline"
            className="flex-1"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
