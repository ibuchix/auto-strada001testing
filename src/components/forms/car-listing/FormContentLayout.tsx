
/**
 * Form Content Layout - Controls the overall layout of the form
 * Created 2028-05-18: Fixed loading state display to prevent form getting stuck
 * Updated 2028-05-19: Added proper error handling and Alert imports
 */

import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { LoadingState } from "./LoadingState"; 
import { CarListingFormData } from "@/types/forms";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface FormContentLayoutProps {
  children: ReactNode;
  form: UseFormReturn<CarListingFormData>;
  isInitializing: boolean;
  isLoadingDraft: boolean;
  layoutId?: string;
  draftError: Error | null;
  onDraftErrorRetry?: () => void;
  onFormSubmit?: (data: CarListingFormData) => Promise<any>;
  onFormError?: (error: Error) => void;
}

export const FormContentLayout = ({
  children,
  isInitializing,
  isLoadingDraft,
  draftError,
  onDraftErrorRetry,
  layoutId = 'form-content'
}: FormContentLayoutProps) => {
  const isLoading = isInitializing || isLoadingDraft;
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6" id={`form-layout-${layoutId}`}>
        <LoadingState message={isLoadingDraft ? "Loading your draft..." : "Initializing form..."} />
      </div>
    );
  }
  
  // Show error state
  if (draftError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load draft</AlertTitle>
          <AlertDescription>
            {draftError.message || "An error occurred while loading your saved draft."}
          </AlertDescription>
          <div className="mt-4">
            {onDraftErrorRetry && (
              <Button variant="outline" size="sm" onClick={onDraftErrorRetry}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </Alert>
      </div>
    );
  }
  
  // Show form content
  return (
    <div className="relative" id={`form-layout-${layoutId}`}>
      {children}
    </div>
  );
};
