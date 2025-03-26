
/**
 * Changes made:
 * - Removed diagnostic-related code
 */

import { useAuth } from "@/components/AuthProvider";
import { useLocation, useSearchParams } from "react-router-dom";
import { FormSubmissionProvider } from "./car-listing/submission/FormSubmissionProvider";
import { FormContent } from "./car-listing/FormContent";
import { FormErrorHandler } from "./car-listing/FormErrorHandler";

export const CarListingForm = () => {
  const { session } = useAuth();
  const location = useLocation();
  const draftId = location.state?.draftId;

  if (!session) {
    return <FormErrorHandler />;
  }

  return (
    <FormSubmissionProvider userId={session.user.id}>
      <FormContent 
        session={session} 
        draftId={draftId} 
      />
    </FormSubmissionProvider>
  );
};
