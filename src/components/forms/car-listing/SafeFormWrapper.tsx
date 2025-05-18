
/**
 * SafeFormWrapper component
 * Created: 2025-05-15
 * Purpose: Provides a safe wrapper for components that need access to form context
 * Updated: 2025-07-24 - Enhanced error handling and added additional safety checks
 * Updated: 2025-08-18 - Improved resilience with multiple form context access methods
 * Updated: 2025-08-27 - Fixed React error #310 by removing conditional hook usage
 * Updated: 2025-05-19 - Fixed React hooks order issues causing React error #310
 */

import React, { ReactNode, useEffect } from 'react';
import { useFormData } from './context/FormDataContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // IMPORTANT: Always access form context the same way in every render
  // to avoid React Error #310 (hooks called in different order)
  const formData = useFormData();
  
  // Early return with fallback if form isn't available
  if (!formData || !formData.form) {
    return <>{fallback}</>;
  }
  
  // If form is loading, show fallback
  if (formData.loading) {
    return <>{fallback}</>;
  }
  
  // If there's an error, show error fallback
  if (formData.error) {
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
              onClick={() => window.location.reload()}
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
  return <>{children(formData.form)}</>;
};
