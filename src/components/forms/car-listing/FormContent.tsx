
/**
 * Form Content
 * Updated: 2025-06-12 - Reorganized section order and added RimPhotosSection
 * Updated: 2025-06-20 - Integrated FormSuccessDialog to show after successful submission
 * Updated: 2025-06-14 - Fixed import of FormSuccessDialog to resolve carId prop error
 */

import { VehicleDetailsSection } from "./sections/VehicleDetailsSection";
import { VehicleStatusSection } from "./sections/VehicleStatusSection";
import { PhotosSection } from "./sections/PhotosSection";
import { RimPhotosSection } from "./sections/RimPhotosSection";
import { SellerDetailsSection } from "./sections/SellerDetailsSection";
import { AdditionalInfoSection } from "./sections/AdditionalInfoSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { FormSection } from "./FormSection";
import { FormSubmitHandler } from "./submission/FormSubmitHandler";
import { useAuth } from "@/components/AuthProvider";
import { FinanceDetailsSection } from "./sections/FinanceDetailsSection";
import { useFormData } from "./context/FormDataContext";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormContextBridge } from "./components/FormContextBridge";
import { FormSuccessDialog } from "./components/FormSuccessDialog"; // FIXED IMPORT

export const FormContent = ({ carId }: { carId?: string }) => {
  const auth = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [valuationLoaded, setValuationLoaded] = useState(false);

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastCarId, setLastCarId] = useState<string | undefined>(undefined);

  const session = auth?.session;
  const isLoading = auth?.isLoading || false;
  const { form } = useFormData();
  const hasOutstandingFinance = form?.watch("hasOutstandingFinance") || false;

  // Load valuation data from localStorage and populate form
  useEffect(() => {
    if (form && !valuationLoaded) {
      try {
        const valuationDataStr = localStorage.getItem('valuationData');
        if (valuationDataStr) {
          const valuationData = JSON.parse(valuationDataStr);
          console.log('FormContent: Loading valuation data into form:', {
            make: valuationData.make,
            model: valuationData.model,
            reservePrice: valuationData.reservePrice,
            valuation: valuationData.valuation
          });

          // Set valuation data in form
          form.setValue('valuationData', valuationData);
          form.setValue('fromValuation', true);

          // Set vehicle details
          if (valuationData.make) form.setValue('make', valuationData.make);
          if (valuationData.model) form.setValue('model', valuationData.model);
          if (valuationData.year) form.setValue('year', parseInt(valuationData.year));
          if (valuationData.mileage) form.setValue('mileage', parseInt(valuationData.mileage));
          if (valuationData.vin) form.setValue('vin', valuationData.vin);
          if (valuationData.transmission) form.setValue('transmission', valuationData.transmission);

          // CRITICAL: Set reserve price from valuation data
          const reservePrice = valuationData.reservePrice || valuationData.valuation || 0;
          if (reservePrice > 0) {
            console.log('FormContent: Setting reserve price from valuation:', reservePrice);
            form.setValue('reservePrice', reservePrice, { shouldDirty: true, shouldTouch: true });
          }

          setValuationLoaded(true);
        } else {
          console.log('FormContent: No valuation data found in localStorage');
          setValuationLoaded(true);
        }
      } catch (error) {
        console.error("FormContent: Error loading valuation data:", error);
        setValuationLoaded(true);
      }
    }
  }, [form, valuationLoaded]);

  // Set authChecked state after a delay
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setAuthChecked(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Handle loading state
  if (isLoading || !authChecked || !valuationLoaded) {
    return <LoadingIndicator message="Loading your session and valuation data..." />;
  }

  // Ensure we have a valid session before continuing
  if (!session) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Session information is not available. Please try signing in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Ensure we have a user ID with a null check
  const userId = session?.user?.id;
  if (!userId) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            User ID not found. Please try signing in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show the success dialog if flag is set
  // Use lastCarId so we have access to the new car id after submission
  // `FormSuccessDialog` should match the rest of your design system

  const handleSubmitSuccess = (carId: string) => {
    console.log("Form submitted successfully with car ID:", carId);
    setLastCarId(carId);
    setShowSuccessDialog(true);
    toast.success("Your car listing has been submitted successfully!", {
      description: "Our team will review your listing and get back to you soon."
    });
  };

  const handleSubmitError = (error: Error) => {
    console.error("Error submitting form:", error);
    toast.error("There was an error submitting your listing", {
      description: error.message
    });
  };

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <VehicleDetailsSection />
      <VehicleStatusSection />

      {/* Show Finance Details Section if hasOutstandingFinance is true */}
      {hasOutstandingFinance && (
        <FinanceDetailsSection />
      )}

      {/* Features and Photos - New Order */}
      <FeaturesSection />
      <PhotosSection carId={carId} />
      <RimPhotosSection />
      <AdditionalInfoSection />

      {/* Seller Information */}
      <SellerDetailsSection />

      <FormSection title="Review & Submit">
        <FormContextBridge>
          <FormSubmitHandler 
            onSubmitSuccess={handleSubmitSuccess}
            onSubmitError={handleSubmitError}
            userId={userId}
            carId={carId}
          />
        </FormContextBridge>
      </FormSection>

      {/* Success Dialog – appears after a successful submission */}
      <FormSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        carId={lastCarId}
      />
    </div>
  );
};

