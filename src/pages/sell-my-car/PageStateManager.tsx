
/**
 * Fix for diagnostic import
 */

import { useEffect } from "react";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { CarListingFormSection } from "./CarListingFormSection";
import { useSearchParams } from "react-router-dom";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";
import { VerificationProgress } from "./VerificationProgress";

interface PageStateManagerProps {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  errorType?: string;
  isVerifying?: boolean;
  handleRetrySellerVerification?: () => void;
}

export const PageStateManager = ({
  isValid,
  isLoading,
  error,
  errorType,
  isVerifying = false,
  handleRetrySellerVerification
}: PageStateManagerProps) => {
  const [searchParams] = useSearchParams();
  const diagnosticId = searchParams.get('diagnostic');
  const from = searchParams.get('from');
  const emergency = searchParams.get('emergency') === 'true';

  useEffect(() => {
    if (diagnosticId) {
      logDiagnostic(
        'PAGE_STATE',
        'PageStateManager rendered',
        {
          isValid,
          isLoading,
          error,
          errorType,
          from,
          emergency,
          url: window.location.href
        },
        diagnosticId
      );
    }
  }, [diagnosticId, isValid, isLoading, error, errorType, from, emergency]);

  if (isLoading) {
    return <LoadingState diagnosticId={diagnosticId} />;
  }

  if (isVerifying) {
    return <VerificationProgress onRetry={handleRetrySellerVerification} />;
  }

  if (!isValid || error) {
    return (
      <ErrorState
        error={error}
        errorType={errorType}
        diagnosticId={diagnosticId}
        from={from}
      />
    );
  }

  return <CarListingFormSection diagnosticId={diagnosticId} />;
};
