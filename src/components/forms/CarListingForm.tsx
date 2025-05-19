
/**
 * Changes made:
 * - 2025-11-02: Added error boundary handling for draft loading errors
 * - 2025-11-03: Added retry functionality for draft loading errors
 * - 2025-11-04: Added support for loading drafts from URL parameters
 * - 2027-11-19: Fixed TypeScript error with onRetry prop
 * - 2025-05-31: Added fromValuation prop to pass to form initialization
 * - 2025-07-26: Fixed valuation data handling and ensured fromValuation prop is passed correctly
 * - 2025-08-01: Enhanced fromValuation detection and added more sources of truth
 * - 2025-05-05: Fixed FormContent props to match component definition
 * - 2025-05-06: Added FormDataProvider to fix context error
 * - 2025-05-08: Fixed type conversion issues with form data
 * - 2025-05-13: Added null session handling with proper loading state
 * - 2025-05-14: Fixed FormErrorHandler prop name (error → draftError)
 * - 2025-05-15: Added form initialization safeguards and error handling
 * - 2025-05-16: Fixed provider hierarchy to ensure consistent form submission flow
 * - 2025-05-19: Fixed React error #310 by ensuring consistent hook order
 * - 2025-05-19: Updated FormSubmissionProvider to use correct props (formId -> userId)
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocation, useSearchParams } from "react-router-dom";
import { FormSubmissionProvider } from "./car-listing/submission/FormSubmissionProvider";
import { FormContent } from "./car-listing/FormContent";
import { FormErrorHandler } from "./car-listing/FormErrorHandler";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { FormDataProvider } from "./car-listing/context/FormDataContext";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./car-listing/hooks/useFormHelpers";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormStateProvider } from "./car-listing/components/FormStateProvider";
import { ErrorProvider } from "@/contexts/ErrorContext";

interface CarListingFormProps {
  fromValuation?: boolean;
}

export const CarListingForm = ({ fromValuation = false }: CarListingFormProps) => {
  const { session, isLoading: isSessionLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationDraftId = location.state?.draftId;
  const urlDraftId = searchParams.get('draft');
  const [draftError, setDraftError] = useState<Error | null>(null);
  const [formError, setFormError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  // Use draft ID from URL parameter or location state
  const draftId = urlDraftId || locationDraftId;
  
  // Initialize the form with proper type conversion and error handling
  // IMPORTANT: Always create the form in the same way on every render
  // to prevent React Error #310
  const initialFormValues = getFormDefaults();
  const form = useForm<CarListingFormData>({
    defaultValues: initialFormValues,
  });
  
  // Determine if coming from valuation based on props, URL params, or location state
  const isFromValuation = fromValuation || 
                          searchParams.get('from') === 'valuation' || 
                          !!location.state?.fromValuation ||
                          !!localStorage.getItem('valuationData');

  useEffect(() => {
    // Set ready state after a short delay to ensure we have session data
    // This helps prevent context errors with React hooks
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const handleDraftError = useCallback((error: Error) => {
    console.error("Draft loading error:", error);
    setDraftError(error);
  }, []);

  const handleRetryDraftLoad = useCallback(() => {
    setDraftError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Show loading indicator while session is loading
  if (isSessionLoading) {
    return <LoadingIndicator message="Loading authentication..." />;
  }

  if (!session) {
    return <FormErrorHandler draftError={new Error("Authentication required. Please sign in to continue.")} />;
  }

  if (draftError) {
    return (
      <FormErrorHandler 
        draftError={draftError} 
        onRetry={handleRetryDraftLoad}
      />
    );
  }

  // Show form error if form initialization failed
  if (formError) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Form Error</AlertTitle>
          <AlertDescription>
            There was an error initializing the form. Please try refreshing the page.
            <div className="mt-2 text-sm">
              Error: {formError.message}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Wait for ready state before rendering form components
  if (!isReady) {
    return <LoadingIndicator message="Preparing form..." />;
  }

  // Proper provider nesting order to avoid hook errors:
  // 1. ErrorProvider (top level)
  // 2. FormStateProvider (shared state)
  // 3. FormSubmissionProvider (form submission logic)
  // 4. FormDataProvider (form field data)
  // 5. Actual form content
  return (
    <ErrorProvider>
      <FormStateProvider>
        <FormSubmissionProvider userId={session.user.id}>
          <FormDataProvider form={form} loading={false} error={null}>
            <FormContent carId={draftId} />
          </FormDataProvider>
        </FormSubmissionProvider>
      </FormStateProvider>
    </ErrorProvider>
  );
};
