
/**
 * Loading state component for the car listing form
 */

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface LoadingStateProps {
  diagnosticId?: string | null;
}

export const LoadingState = ({ diagnosticId }: LoadingStateProps) => {
  useEffect(() => {
    if (diagnosticId) {
      logDiagnostic(
        'LOADING_STATE_RENDERED',
        'Loading state is being displayed to user',
        {
          timestamp: new Date().toISOString(),
          url: window.location.href
        },
        diagnosticId
      );
    }
  }, [diagnosticId]);

  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-medium text-dark mb-2">Loading your listing form</h2>
      <p className="text-subtitle text-center max-w-md">
        Please wait while we prepare your car listing form...
      </p>
    </div>
  );
};
