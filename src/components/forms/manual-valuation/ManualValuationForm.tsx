
import { Form } from "@/components/ui/form";
import { VehicleDetailsSection } from "./VehicleDetailsSection";
import { ConditionSection } from "./ConditionSection";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { ContactSection } from "./ContactSection";
import { FeaturesSection } from "../car-listing/FeaturesSection";
import { ServiceHistorySection } from "./components/ServiceHistorySection";
import { AdditionalInfoSection } from "../car-listing/AdditionalInfoSection";
import { SellerNotesSection } from "../car-listing/SellerNotesSection";
import { VehicleStatusSection } from "../car-listing/VehicleStatusSection";
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
              <VehicleStatusSection />
              <ConditionSection form={form} />
              <FeaturesSection />
              <ServiceHistorySection />
              <AdditionalInfoSection />
              <PhotoUploadSection 
                form={form} 
                onProgressUpdate={setUploadProgress}
              />
              <SellerNotesSection />
              <ContactSection form={form} />
            </div>

            <SubmitButton isSubmitting={isSubmitting} />
          </div>
        </form>
      </Form>
    </FormDataProvider>
  );
};
