
/**
 * Changes made:
 * - Removed diagnostic-related code
 * - 2025-11-02: Added error boundary handling for draft loading errors
 * - 2025-11-03: Added retry functionality for draft loading errors
 * - 2025-11-04: Added support for loading drafts from URL parameters
 * - 2027-11-19: Fixed TypeScript error with onRetry prop
 * - 2025-05-31: Added fromValuation prop to pass to form initialization
 * - 2025-07-26: Fixed valuation data handling and ensured fromValuation prop is passed correctly
 * - 2025-08-01: Enhanced fromValuation detection and added more sources of truth
 * - 2025-05-05: Fixed FormContent props to match component definition
 * - 2025-05-06: Added FormDataProvider to fix context error
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
  
  // Initialize the form
  const form = useForm<CarListingFormData>({
    defaultValues: {
      make: "",
      model: "",
      year: "",
      color: "",
      mileage: "",
      transmission: "",
      fuel_type: "",
      price: "",
      description: "",
      hasOutstandingFinance: false,
      isDamaged: false
    }
  });
  
  // Determine if coming from valuation based on props, URL params, or location state
  const isFromValuation = fromValuation || 
                          searchParams.get('from') === 'valuation' || 
                          !!location.state?.fromValuation ||
                          !!localStorage.getItem('valuationData');

  useEffect(() => {
    if (urlDraftId) {
      console.log("Loading draft from URL parameter:", urlDraftId);
    } else if (locationDraftId) {
      console.log("Loading draft from location state:", locationDraftId);
    }
    
    // Log valuation status
    if (isFromValuation) {
      console.log("CarListingForm: Form initialized with valuation data", {
        fromProp: fromValuation,
        fromLocationState: !!location.state?.fromValuation,
        fromSearchParam: searchParams.get('from') === 'valuation',
        hasValuationData: !!localStorage.getItem('valuationData')
      });
      
      // Show toast to inform user their data was loaded
      const valuationData = localStorage.getItem('valuationData');
      if (valuationData) {
        try {
          const parsedData = JSON.parse(valuationData);
          toast.success("Vehicle valuation data loaded", {
            description: `${parsedData.year || ''} ${parsedData.make || ''} ${parsedData.model || ''}`.trim(),
            duration: 5000
          });
        } catch (e) {
          console.error("Error parsing valuation data:", e);
        }
      }
    }
  }, [urlDraftId, locationDraftId, fromValuation, location.state, searchParams, isFromValuation]);

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
      <FormDataProvider form={form}>
        <FormContent carId={draftId} />
      </FormDataProvider>
    </FormSubmissionProvider>
  );
};
