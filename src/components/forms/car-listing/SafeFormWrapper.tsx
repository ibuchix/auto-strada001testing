
/**
 * SafeFormWrapper component
 * Created: 2025-05-15
 * Purpose: Provides a safe wrapper for components that need access to form context
 * Updated: 2025-07-24 - Enhanced error handling and added additional safety checks
 * Updated: 2025-08-18 - Improved resilience with multiple form context access methods
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { useResilientFormData } from './context/FormDataContext';

interface SafeFormWrapperProps {
  children: (formMethods: any) => ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
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
  )
}: SafeFormWrapperProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [formMethods, setFormMethods] = useState<any>(null);
  
  // Get form context safely using our enhanced hook that tries multiple approaches
  const formData = useResilientFormData(true);
  
  useEffect(() => {
    try {
      // Check if form context is available
      if (formData?.form) {
        setFormMethods(formData.form);
        setIsLoading(false);
      } else {
        console.log("SafeFormWrapper: Form context not available yet");
        // Keep loading state true
        setIsLoading(true);
        
        // Set a timeout to show error if form context doesn't appear
        const timer = setTimeout(() => {
          if (!formData?.form) {
            console.error("SafeFormWrapper: Form context still not available after timeout");
            setError(new Error("Form context unavailable"));
            setIsLoading(false);
          }
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error("Error in SafeFormWrapper:", err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [formData]);
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  if (error || !formMethods) {
    return <>{errorFallback}</>;
  }
  
  // Only render children if form methods are available
  return <>{children(formMethods)}</>;
};
