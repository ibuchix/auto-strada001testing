
/**
 * SafeFormWrapper component
 * Created: 2025-05-15
 * Purpose: Provides a safe wrapper for components that need access to form context
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSafeFormData } from './context/FormDataContext';

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
  
  // Get form context safely
  const formDataContext = useSafeFormData();
  
  useEffect(() => {
    try {
      // Try to get form from context
      if (formDataContext?.form) {
        setFormMethods({
          ...formDataContext.form
        });
        setIsLoading(false);
      }
      // Fallback to useFormContext
      else {
        try {
          const form = useFormContext();
          if (form) {
            setFormMethods({
              ...form
            });
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Error accessing form context:", err);
          setError(err as Error);
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error("Error in SafeFormWrapper:", err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [formDataContext]);
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  if (error || !formMethods) {
    return <>{errorFallback}</>;
  }
  
  return <>{children(formMethods)}</>;
};
