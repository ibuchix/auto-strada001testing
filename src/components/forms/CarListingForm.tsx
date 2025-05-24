
/**
 * Changes made:
 * - 2025-05-24: REMOVED ALL DRAFT LOGIC - Only handles immediate listing creation or editing existing cars
 * - 2025-05-24: Fixed valuation data preservation through submission pipeline
 * - 2025-05-24: Simplified form initialization to remove unnecessary complexity
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
import { FormStateProvider } from "./car-listing/context/FormStateContext";
import { ErrorProvider } from "@/contexts/ErrorContext";

interface CarListingFormProps {
  fromValuation?: boolean;
  carId?: string; // Only for editing existing cars
}

export const CarListingForm = ({ fromValuation = false, carId }: CarListingFormProps) => {
  const auth = useAuth();
  const { session, isLoading: isSessionLoading } = auth || { session: null, isLoading: true };
  
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Initialize the form with proper type conversion and error handling
  const initialFormValues = getFormDefaults();
  const form = useForm<CarListingFormData>({
    defaultValues: initialFormValues,
  });
  
  // Determine if coming from valuation based on props, URL params, or location state
  const isFromValuation = fromValuation || 
                          searchParams.get('from') === 'valuation' || 
                          !!location.state?.fromValuation ||
                          !!localStorage.getItem('valuationData');

  // Set ready state after auth is initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[CarListingForm] Setting ready state', { 
        hasSession: !!session, 
        isLoading: isSessionLoading,
        carId: carId || 'new',
        isFromValuation
      });
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [session, isSessionLoading, carId, isFromValuation]);

  // Show loading indicator while auth is initializing
  if (isSessionLoading || !isReady) {
    return <LoadingIndicator message="Loading authentication..." />;
  }

  // Check for missing authentication
  if (!session) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          Please sign in to continue. You need to be authenticated to list a car.
        </AlertDescription>
      </Alert>
    );
  }

  const userId = session?.user?.id;
  
  if (!userId) {
    return <FormErrorHandler draftError={new Error("User ID not found. Please sign in again.")} />;
  }

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

  console.log('[CarListingForm] Rendering form components', { 
    userId, 
    carId: carId || 'new', 
    isFromValuation 
  });

  return (
    <ErrorProvider>
      <FormStateProvider>
        <FormSubmissionProvider userId={userId}>
          <FormDataProvider form={form} loading={false} error={null}>
            <FormContent carId={carId} />
          </FormDataProvider>
        </FormSubmissionProvider>
      </FormStateProvider>
    </ErrorProvider>
  );
};
