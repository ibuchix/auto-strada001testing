
/**
 * Changes made:
 * - 2024-08-08: Refactored into a multi-step form with navigation and progress tracking
 * - 2024-09-02: Enhanced with better draft saving and offline mode indication
 * - 2024-09-05: Refactored into smaller components for better maintainability
 * - 2027-07-24: Added support for diagnosticId prop for improved debugging
 * - 2027-07-27: Enhanced diagnosticId extraction from URL search params for better tracing
 */

import { useAuth } from "@/components/AuthProvider";
import { useLocation, useSearchParams } from "react-router-dom";
import { FormSubmissionProvider } from "./car-listing/submission/FormSubmissionProvider";
import { FormContent } from "./car-listing/FormContent";
import { FormErrorHandler } from "./car-listing/FormErrorHandler";

interface CarListingFormProps {
  diagnosticId?: string;
}

export const CarListingForm = ({ diagnosticId: propDiagnosticId }: CarListingFormProps) => {
  const { session } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const draftId = location.state?.draftId;
  
  // Check for diagnostic ID in URL params first, then use the prop if provided
  const urlDiagnosticId = searchParams.get('diagnostic');
  const effectiveDiagnosticId = urlDiagnosticId || propDiagnosticId;
  
  // Log diagnostic information if available
  if (effectiveDiagnosticId) {
    console.log(`CarListingForm: Initialized with diagnosticId ${effectiveDiagnosticId}`);
    console.log('Navigation source:', {
      from: searchParams.get('from'),
      clickId: searchParams.get('clickId'),
      emergency: searchParams.get('emergency')
    });
  }

  if (!session) {
    return <FormErrorHandler />;
  }

  return (
    <FormSubmissionProvider userId={session.user.id}>
      <FormContent 
        session={session} 
        draftId={draftId} 
        diagnosticId={effectiveDiagnosticId} 
      />
    </FormSubmissionProvider>
  );
};
