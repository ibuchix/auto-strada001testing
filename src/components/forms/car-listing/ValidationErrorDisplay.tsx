
/**
 * Component to display validation errors in a structured format
 * - Shows field-specific error messages
 * - Provides easy navigation to error fields
 * - Visual indicators for error severity
 * - 2027-11-21: Updated props interface to support string array or record format
 * - 2028-03-27: Fixed type definition for validationErrors to properly handle string arrays
 * - 2024-06-22: Updated interface to support various error formats consistently
 * - 2024-06-23: Added strict type checking and memoization to prevent render loops
 * - 2024-06-24: Added React.memo and useMemo to prevent needless rerenders
 */

import { AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, memo, useCallback } from "react";

interface ValidationErrorDisplayProps {
  validationErrors: string[] | Record<string, string> | any;
  title?: string;
  onDismiss?: () => void;
}

export const ValidationErrorDisplay = memo(({ 
  validationErrors,
  title = "Please correct the following errors:",
  onDismiss
}: ValidationErrorDisplayProps) => {
  // Convert validation errors to array format for consistent display - memoize to prevent rerenders
  const { hasErrors, errorsArray } = useMemo(() => {
    // Handle different formats of validation errors
    const hasErrors = Array.isArray(validationErrors) 
      ? validationErrors.length > 0
      : typeof validationErrors === 'object' && validationErrors !== null
        ? Object.keys(validationErrors).length > 0
        : Boolean(validationErrors);
      
    if (!hasErrors) {
      return { hasErrors: false, errorsArray: [] };
    }

    // Convert to array format
    const errorsArray = Array.isArray(validationErrors)
      ? validationErrors
      : typeof validationErrors === 'object' && validationErrors !== null
        ? Object.entries(validationErrors).map(([field, message]) => 
            typeof message === 'string' 
              ? `${field}: ${message}`
              : Array.isArray(message) 
                ? message.join(', ') 
                : `${field}: Invalid format`)
        : [String(validationErrors)];
    
    return { hasErrors, errorsArray };
  }, [validationErrors]);
    
  if (!hasErrors) {
    return null;
  }

  // Get the count of errors
  const errorCount = errorsArray.length;
  
  // Memoize error handling function
  const handleErrorClick = useCallback((field: string) => {
    const element = document.getElementById(field);
    if (element) {
      // Scroll the element into view with offset
      const yOffset = -100; // 100px from the top
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      // Focus after scrolling completes
      setTimeout(() => element.focus(), 500);
    }
  }, []);

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-red-800">
              {title} ({errorCount} {errorCount === 1 ? 'error' : 'errors'})
            </h3>
            {onDismiss && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                onClick={onDismiss}
              >
                <XCircle className="h-5 w-5" />
                <span className="sr-only">Dismiss</span>
              </Button>
            )}
          </div>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {errorsArray.map((error, index) => {
              // Extract field name if the error is in format "field: message"
              const match = String(error).match(/^([^:]+):\s*(.+)$/);
              const field = match ? match[1] : '';
              const message = match ? match[2] : String(error);
              
              return (
                <li key={index} className="flex items-start">
                  <span className="inline-block h-4 w-4 flex-shrink-0" />
                  <button 
                    type="button"
                    className="text-left underline hover:text-red-800 focus:outline-none focus:text-red-900"
                    onClick={() => handleErrorClick(field)}
                  >
                    {message}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
});

// Add display name for React DevTools
ValidationErrorDisplay.displayName = "ValidationErrorDisplay";
