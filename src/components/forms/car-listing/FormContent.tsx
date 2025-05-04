
/**
 * Form Content
 * Updated: 2025-05-04 - Added FinanceDetailsSection to the form flow
 * Updated: 2025-05-05 - Fixed import paths and updated AuthProvider usage
 * Updated: 2025-05-06 - Fixed useFormData hook usage with proper context
 * Updated: 2025-05-11 - Fixed session access to prevent destructuring error
 * Updated: 2025-05-13 - Added null check for session to avoid destructuring error
 * Updated: 2025-05-15 - Updated VehicleDetailsSection import path
 * 
 * Main content component for the car listing form
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

export const FormContent = ({ carId }: { carId?: string }) => {
  const { session, isLoading } = useAuth();
  const { form } = useFormData();
  const hasOutstandingFinance = form.watch("hasOutstandingFinance");
  const isDamaged = form.watch("isDamaged");
  
  // Handle loading and null session states
  if (isLoading) {
    return <LoadingIndicator message="Loading your session..." />;
  }

  // Ensure we have a valid session before continuing
  if (!session) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <p className="text-center text-gray-600">
          Session information is not available. Please try refreshing the page.
        </p>
      </div>
    );
  }
  
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
          carId={carId} 
          userId={session?.user?.id}
          onSubmitSuccess={(carId) => {
            console.log("Form submitted successfully with car ID:", carId);
          }}
          onSubmitError={(error) => {
            console.error("Error submitting form:", error);
          }}
        />
      </FormSection>
    </div>
  );
};
