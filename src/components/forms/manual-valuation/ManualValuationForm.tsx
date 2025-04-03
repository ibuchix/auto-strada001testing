
/**
 * Changes made:
 * - Updated imports to use special components for manual valuation
 * - Fixed component props to pass form to components that need it
 */

import { Form } from "@/components/ui/form";
import { VehicleDetailsSection } from "./VehicleDetailsSection";
import { ConditionSection } from "./ConditionSection";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { ContactSection } from "./ContactSection";
import { ServiceHistorySection } from "./components/ServiceHistorySection";
import { SellerNotesSection as CarListingSellerNotesSection } from "../car-listing/SellerNotesSection";
import { VehicleStatusSection } from "./components/VehicleStatusSection";
import { FeaturesSection as CarListingFeaturesSection } from "../car-listing/FeaturesSection";
import { AdditionalInfoSection as CarListingAdditionalInfoSection } from "../car-listing/AdditionalInfoSection";
import { FormHeader } from "./components/FormHeader";
import { SubmitButton } from "./components/SubmitButton";
import { useManualValuationForm } from "./hooks/useManualValuationForm";
import { FormDataProvider } from "../car-listing/context/FormDataContext";

export const ManualValuationForm = () => {
  const { form, isSubmitting, uploadProgress, setUploadProgress, onSubmit } = useManualValuationForm();

  return (
    <FormDataProvider form={form}>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
            <FormHeader />

            <div className="space-y-8">
              <VehicleDetailsSection form={form} />
              <VehicleStatusSection form={form} />
              <ConditionSection form={form} />
              <FormDataProvider form={form}>
                <FeaturesSection />
                <ServiceHistorySection />
                <AdditionalInfoSection />
                <SellerNotesSection />
              </FormDataProvider>
              <PhotoUploadSection 
                form={form} 
                onProgressUpdate={setUploadProgress}
              />
              <ContactSection form={form} />
            </div>

            <SubmitButton isSubmitting={isSubmitting} />
          </div>
        </form>
      </Form>
    </FormDataProvider>
  );
};

// Add components used only in this file
const FeaturesSection = () => <CarListingFeaturesSection />;
const AdditionalInfoSection = () => <CarListingAdditionalInfoSection />;
const SellerNotesSection = () => <CarListingSellerNotesSection />;
