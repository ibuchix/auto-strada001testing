
/**
 * Changes made:
 * - 2024-08-16: Created error boundary fallback component using the centralized error handling
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useErrorContext } from '@/contexts/ErrorContext';
import { logError } from '@/utils/errorLogger';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorBoundaryFallback = ({ 
  error, 
  resetErrorBoundary 
}: ErrorBoundaryFallbackProps) => {
  const errorContext = useErrorContext();
  
  // Log the error when the component mounts
  useEffect(() => {
    // Log to our structured logger
    logError(error, 'Error boundary caught error');
    
    // Also capture in error context
    errorContext.captureError(error);
    
    // Clean up when unmounting
    return () => {
      errorContext.clearError();
    };
  }, [error, errorContext]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-[#DC143C]/10 border-b border-[#DC143C]/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-[#DC143C]" />
            <CardTitle className="text-[#DC143C]">Application Error</CardTitle>
          </div>
          <CardDescription>
            Something went wrong in this part of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="font-medium">Error details:</p>
            <div className="bg-slate-50 p-3 rounded border text-sm font-mono overflow-auto max-h-[150px]">
              {error.message || 'An unexpected error occurred'}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
          <Button 
            onClick={resetErrorBoundary}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90"
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
