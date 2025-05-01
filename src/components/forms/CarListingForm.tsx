
/**
 * Changes made:
 * - Removed diagnostic-related code
 * - 2025-11-02: Added error boundary handling for draft loading errors
 * - 2025-11-03: Added retry functionality for draft loading errors
 * - 2025-11-04: Added support for loading drafts from URL parameters
 * - 2027-11-19: Fixed TypeScript error with onRetry prop
 * - 2025-05-31: Added fromValuation prop to pass to form initialization
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocation, useSearchParams } from "react-router-dom";
import { FormSubmissionProvider } from "./car-listing/submission/FormSubmissionProvider";
import { FormContent } from "./car-listing/FormContent";
import { FormErrorHandler } from "./car-listing/FormErrorHandler";

interface CarListingFormProps {
  fromValuation?: boolean;
}

export const CarListingForm = ({ fromValuation = false }: CarListingFormProps) => {
  const { session } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationDraftId = location.state?.draftId;
  const urlDraftId = searchParams.get('draft');
  const [draftError, setDraftError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use draft ID from URL parameter or location state
  const draftId = urlDraftId || locationDraftId;

  useEffect(() => {
    if (urlDraftId) {
      console.log("Loading draft from URL parameter:", urlDraftId);
    } else if (locationDraftId) {
      console.log("Loading draft from location state:", locationDraftId);
    }
    
    // Log valuation status
    if (fromValuation || location.state?.fromValuation) {
      console.log("CarListingForm: Form initialized with valuation data", {
        fromProp: fromValuation,
        fromLocationState: !!location.state?.fromValuation,
        hasValuationData: !!localStorage.getItem('valuationData')
      });
    }
  }, [urlDraftId, locationDraftId, fromValuation, location.state]);

  const handleDraftError = useCallback((error: Error) => {
    console.error("Draft loading error:", error);
    setDraftError(error);
  }, []);

  const handleRetryDraftLoad = useCallback(() => {
    setDraftError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  if (!session) {
    return <FormErrorHandler />;
  }

  if (draftError) {
    return (
      <FormErrorHandler 
        draftError={draftError} 
        onRetry={handleRetryDraftLoad}
      />
    );
  }

  return (
    <FormSubmissionProvider userId={session.user.id}>
      <FormContent 
        session={session} 
        draftId={draftId} 
        onDraftError={handleDraftError}
        retryCount={retryCount}
        fromValuation={fromValuation || !!location.state?.fromValuation}
      />
    </FormSubmissionProvider>
  );
};
