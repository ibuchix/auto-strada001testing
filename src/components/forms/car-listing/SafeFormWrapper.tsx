/**
 * SafeFormWrapper component
 * Created: 2025-05-15
 * Purpose: Provides a safe wrapper for components that need access to form context
 * Updated: 2025-07-24 - Enhanced error handling and added additional safety checks
 * Updated: 2025-08-18 - Improved resilience with multiple form context access methods
 * Updated: 2025-08-27 - Fixed React error #310 by adding context validation checks
 * Updated: 2025-08-27 - Added automatic recovery mechanism for missing context
 */

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { useResilientFormData } from './context/FormDataContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SafeFormWrapperProps {
  children: (formMethods: any) => ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  attemptAutoRecovery?: boolean;
}

export const SafeFormWrapper = ({
  children,
  fallback = <div className="p-4 text-center">Loading form section...</div>,
  errorFallback = (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
      <p className="text-amber-800">
        There was an issue loading this form section. Please try refreshing the page.
      </p>
    </div>
  ),
  attemptAutoRecovery = true
}: SafeFormWrapperProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [formMethods, setFormMethods] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const recoveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate a component ID for debugging
  const componentId = useRef(`wrapper-${Math.random().toString(36).substring(2, 8)}`);
  
  // Get form context safely using our enhanced hook that tries multiple approaches
  const formData = useResilientFormData(true);
  
  // Function to retry context loading
  const attemptRecovery = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    // Log the recovery attempt
    console.log(`SafeFormWrapper[${componentId.current}]: Attempting recovery #${retryCount + 1}`);
  };
  
  useEffect(() => {
    // Clear any existing recovery timer when component unmounts
    // or dependencies change
    return () => {
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    try {
      // First, check if the form context exists and has properly initialized form
      // This helps prevent React error #310 (hook out of order) by validating context
      if (formData?.form && 
          formData.form.register && 
          typeof formData.form.register === 'function') {
        
        setFormMethods(formData.form);
        setIsLoading(false);
        setError(null);
        
        // Clear recovery timer if it exists since we succeeded
        if (recoveryTimerRef.current) {
          clearTimeout(recoveryTimerRef.current);
          recoveryTimerRef.current = null;
        }
      } else {
        console.log(`SafeFormWrapper[${componentId.current}]: Form context not available yet or incomplete`);
        
        // Keep loading state true
        setIsLoading(true);
        
        // Set a timeout to show error if form context doesn't appear
        if (!recoveryTimerRef.current && attemptAutoRecovery) {
          recoveryTimerRef.current = setTimeout(() => {
            if (!formData?.form || !formData.form.register) {
              console.warn(`SafeFormWrapper[${componentId.current}]: Form context still unavailable after timeout`);
              
              if (retryCount < 3) {
                // Try automatic recovery up to 3 times
                setRetryCount(prev => prev + 1);
                
                // Reset the recovery timer
                recoveryTimerRef.current = null;
              } else {
                // After 3 attempts, show the error
                setError(new Error("Form context unavailable after multiple attempts"));
                setIsLoading(false);
              }
            }
          }, 1500 + (retryCount * 500)); // Increase timeout with each retry
        }
      }
    } catch (err) {
      console.error(`SafeFormWrapper[${componentId.current}]: Error:`, err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [formData, retryCount, attemptAutoRecovery]);
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  if (error || !formMethods) {
    return (
      <div className="space-y-4">
        {errorFallback}
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTitle>Form Section Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>This section isn't loading properly. You can try to recover it:</p>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              onClick={attemptRecovery}
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Retry Loading</span>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Only render children if form methods are available and valid
  return <>{children(formMethods)}</>;
};
