
/**
 * Changes made:
 * - 2024-08-08: Refactored into a multi-step form with navigation and progress tracking
 * - 2024-09-02: Enhanced with better draft saving and offline mode indication
 * - 2024-09-05: Refactored into smaller components for better maintainability
 */

import { useAuth } from "@/components/AuthProvider";
import { useLocation } from "react-router-dom";
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
      <FormContent session={session} draftId={draftId} />
    </FormSubmissionProvider>
  );
};
