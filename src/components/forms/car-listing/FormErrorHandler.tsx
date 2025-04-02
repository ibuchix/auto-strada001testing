
/**
 * Changes made:
 * - 2027-11-17: Created component to handle form errors with recovery options
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FormErrorHandlerProps {
  draftError?: Error;
}

export const FormErrorHandler: React.FC<FormErrorHandlerProps> = ({ draftError }) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleStartOver = () => {
    // Clear any saved draft data that might be causing issues
    localStorage.removeItem('valuationData');
    navigate('/sellers');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Alert variant="destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        <AlertTitle>Error Loading Form</AlertTitle>
        <AlertDescription className="mt-2">
          {draftError ? (
            <p>{draftError.message || "Failed to load draft data"}</p>
          ) : (
            <p>There was a problem loading the form. Please try again or start over.</p>
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

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-amber-800">Technical Information</h3>
        <p className="text-sm text-amber-700 mt-2">
          If this issue persists, please report it with the following error code:
          <code className="bg-amber-100 px-2 py-1 rounded mx-1">
            {draftError?.name || "FORM_LOAD_ERROR"}
          </code>
        </p>
      </div>
    </div>
  );
};
