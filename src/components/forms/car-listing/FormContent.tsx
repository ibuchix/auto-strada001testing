
/**
 * Form Content
 * Updated: 2025-05-04 - Added FinanceDetailsSection to the form flow
 * Updated: 2025-05-05 - Fixed import paths and updated AuthProvider usage
 * Updated: 2025-05-06 - Fixed useFormData hook usage with proper context
 * Updated: 2025-05-11 - Fixed session access to prevent destructuring error
 * Updated: 2025-05-13 - Added null check for session to avoid destructuring error
 * Updated: 2025-05-15 - Updated VehicleDetailsSection import path
 * Updated: 2025-05-16 - Improved submission handling and edge function integration
 * Updated: 2025-05-22 - Updated field names to use snake_case to match database schema
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 * Updated: 2025-05-29 - Fixed FormSubmitHandler prop types
 * Updated: 2025-06-07 - Enhanced session handling with safer access patterns
 * Updated: 2025-06-20 - Fixed destructuring issues and added additional safety checks
 */

import { VehicleDetailsSection } from "./sections/VehicleDetailsSection";
import { VehicleStatusSection } from "./sections/VehicleStatusSection";
import { PhotosSection } from "./sections/PhotosSection";
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

export const FormContent = ({ carId }: { carId?: string }) => {
  const auth = useAuth(); // Safely get auth context
  const [authChecked, setAuthChecked] = useState(false);
  
  // Use a safer pattern to access auth data with proper null checks
  const session = auth?.session;
  const isLoading = auth?.isLoading || false;
  
  const { form } = useFormData();
  // Get form values safely with null check
  const hasOutstandingFinance = form?.watch("hasOutstandingFinance") || false;
  
  // Set form metadata for valuation tracking
  useEffect(() => {
    if (form) { // Add null check
      try {
        const hasValuationData = !!localStorage.getItem('valuationData');
        if (hasValuationData) {
          form.setValue('fromValuation', true);
        }
      } catch (error) {
        console.error("Error setting valuation flag:", error);
      }
    }
  }, [form]);
  
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
  if (isLoading || !authChecked) {
    return <LoadingIndicator message="Loading your session..." />;
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

  const handleSubmitSuccess = (carId: string) => {
    console.log("Form submitted successfully with car ID:", carId);
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
      <VehicleDetailsSection />
      <VehicleStatusSection />
      
      {/* Show Finance Details Section if hasOutstandingFinance is true */}
      {hasOutstandingFinance && (
        <FinanceDetailsSection />
      )}
      
      <FeaturesSection />
      <AdditionalInfoSection />
      <PhotosSection carId={carId} />
      <SellerDetailsSection />
      
      <FormSection title="Review & Submit">
        <FormSubmitHandler 
          onSubmitSuccess={handleSubmitSuccess}
          onSubmitError={handleSubmitError}
          userId={userId}
          carId={carId}
        />
      </FormSection>
    </div>
  );
};
