
/**
 * Changes made:
 * - Removed diagnostic-related code
 * - 2025-11-02: Added error boundary handling for draft loading errors
 * - 2025-11-03: Added retry functionality for draft loading errors
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocation, useSearchParams } from "react-router-dom";
import { FormSubmissionProvider } from "./car-listing/submission/FormSubmissionProvider";
import { FormContent } from "./car-listing/FormContent";
import { FormErrorHandler } from "./car-listing/FormErrorHandler";

export const CarListingForm = () => {
  const { session } = useAuth();
  const location = useLocation();
  const draftId = location.state?.draftId;
  const [draftError, setDraftError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
      />
    </FormSubmissionProvider>
  );
};
