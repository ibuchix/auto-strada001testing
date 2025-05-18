
/**
 * Changes made:
 * - 2027-11-17: Created component to handle form errors with recovery options
 * - 2027-11-18: Added onRetry prop for error recovery functionality
 * - 2028-05-15: Enhanced error display with technical details
 * - 2028-05-15: Added error type differentiation
 * - 2025-05-19: Added handling for React Error #310 (hooks order issue)
 */

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FormErrorHandlerProps {
  draftError?: Error;
  onRetry?: () => void;
  showTechnicalInfo?: boolean;
}

export const FormErrorHandler: React.FC<FormErrorHandlerProps> = ({ 
  draftError, 
  onRetry,
  showTechnicalInfo = true
}) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");

  // Extract error information on mount
  useEffect(() => {
    if (draftError) {
      // Check for React Error #310
      const isReactError310 = 
        draftError.message.includes("310") || 
        draftError.message.includes("Minified React error #310");
      
      if (isReactError310) {
        setErrorDetails(
          "React Error #310 detected: This is likely due to inconsistent use of React hooks. " +
          "The application will reload to fix the issue."
        );
        
        // Auto-reload after 5 seconds for React Error #310
        const timer = setTimeout(() => {
          handleRefresh();
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [draftError]);

  // Log error for debugging
  console.error("[FormErrorHandler] Handling error:", draftError);

  const handleRefresh = () => {
    if (onRetry) {
      console.log("[FormErrorHandler] Using provided retry handler");
      onRetry();
    } else {
      console.log("[FormErrorHandler] No retry handler provided, reloading page");
      window.location.reload();
    }
  };

  const handleStartOver = () => {
    console.log("[FormErrorHandler] Starting over, clearing localStorage data");
    // Clear any saved draft data that might be causing issues
    localStorage.removeItem('valuationData');
    navigate('/sellers');
  };

  // Determine error type for better user messaging
  const errorType = draftError ? 
    draftError.name === 'NetworkError' ? 'network' :
    draftError.name === 'ValidationError' ? 'validation' :
    draftError.message.toLowerCase().includes('permission') ? 'permission' :
    draftError.message.toLowerCase().includes('auth') ? 'auth' :
    draftError.message.toLowerCase().includes('hooks') || draftError.message.includes("310") ? 'hook' :
    draftError.message.toLowerCase().includes('draft') ? 'draft' : 'generic'
    : 'unknown';

  // Get user-friendly error message based on type
  const getUserMessage = () => {
    switch(errorType) {
      case 'network':
        return "Network connection issue. Please check your internet connection and try again.";
      case 'validation':
        return "There was an issue with the form data. Some information may be invalid or missing.";
      case 'permission':
        return "You don't have permission to access this draft. Please sign in with the correct account.";
      case 'auth':
        return "Authentication error. Please sign in again to continue.";
      case 'draft':
        return "There was a problem loading your draft. The data may be corrupted or missing.";
      case 'hook':
        return "There was a technical issue with the form. The page will reload automatically to fix it.";
      default:
        return draftError ? 
          draftError.message || "An error occurred while loading the form." :
          "There was a problem loading the form. Please try again or start over.";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Alert variant="destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        <AlertTitle>Error Loading Form</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{getUserMessage()}</p>
          {errorDetails && (
            <p className="mt-2 text-sm font-medium">{errorDetails}</p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mt-6">
        <Button 
          onClick={handleRefresh}
          className="flex items-center space-x-2"
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Reload Page</span>
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleStartOver}
        >
          Start New Valuation
        </Button>
      </div>

      {showTechnicalInfo && draftError && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-amber-800">Technical Information</h3>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 p-1"
            >
              {showDetails ? 
                <ChevronUp className="h-4 w-4 text-amber-700" /> : 
                <ChevronDown className="h-4 w-4 text-amber-700" />
              }
            </Button>
          </div>
          
          <p className="text-sm text-amber-700 mt-2">
            If this issue persists, please report it with the following error code:
            <code className="bg-amber-100 px-2 py-1 rounded mx-1">
              {errorType === 'hook' ? 'REACT_HOOK_ERROR' : draftError?.name || "FORM_LOAD_ERROR"}
            </code>
          </p>
          
          {showDetails && (
            <div className="mt-3 p-2 bg-amber-100/50 rounded overflow-auto max-h-48">
              <p className="font-mono text-xs whitespace-pre-wrap">
                {draftError.stack || draftError.toString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
