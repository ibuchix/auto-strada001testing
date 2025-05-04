
/**
 * Form Content
 * Updated: 2025-05-04 - Added FinanceDetailsSection to the form flow
 * Updated: 2025-05-05 - Fixed import paths and updated AuthProvider usage
 * Updated: 2025-05-06 - Fixed useFormData hook usage with proper context
 * 
 * Main content component for the car listing form
 */

import { VehicleDetailsSection } from "./sections/VehicleDetailsSection";
import { VehicleStatusSection } from "./sections/VehicleStatusSection";
import { PhotosSection } from "./sections/PhotosSection";
import { SellerDetailsSection } from "./sections/SellerDetailsSection";
import { AdditionalInfoSection } from "../car-listing/AdditionalInfoSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { FormSection } from "./FormSection";
import { FormSubmitHandler } from "./submission/FormSubmitHandler";
import { useAuth } from "@/components/AuthProvider";
import { FinanceDetailsSection } from "./sections/FinanceDetailsSection";
import { useFormData } from "./context/FormDataContext";

export const FormContent = ({ carId }: { carId?: string }) => {
  const { session } = useAuth();
  const { form } = useFormData();
  const hasOutstandingFinance = form.watch("hasOutstandingFinance");
  const isDamaged = form.watch("isDamaged");
  
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
