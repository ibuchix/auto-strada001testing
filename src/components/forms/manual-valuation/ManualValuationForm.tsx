import { Form } from "@/components/ui/form";
import { VehicleDetailsSection } from "./VehicleDetailsSection";
import { ConditionSection } from "./ConditionSection";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { ContactSection } from "./ContactSection";
import { FeaturesSection } from "../car-listing/FeaturesSection";
import { ServiceHistorySection } from "../car-listing/ServiceHistorySection";
import { AdditionalInfoSection } from "../car-listing/AdditionalInfoSection";
import { SellerNotesSection } from "../car-listing/SellerNotesSection";
import { VehicleStatusSection } from "../car-listing/VehicleStatusSection";
import { FormHeader } from "./components/FormHeader";
import { SubmitButton } from "./components/SubmitButton";
import { useManualValuationForm } from "./hooks/useManualValuationForm";

export const ManualValuationForm = () => {
  const { form, isSubmitting, uploadProgress, setUploadProgress, onSubmit } = useManualValuationForm();

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          <FormHeader />

          <div className="space-y-8">
            <VehicleDetailsSection form={form} />
            <VehicleStatusSection form={form} />
            <ConditionSection form={form} />
            <FeaturesSection form={form} />
            <ServiceHistorySection form={form} />
            <AdditionalInfoSection form={form} />
            <PhotoUploadSection 
              form={form} 
              onProgressUpdate={setUploadProgress}
            />
            <SellerNotesSection form={form} />
            <ContactSection form={form} />
          </div>

          <SubmitButton isSubmitting={isSubmitting} />
        </div>
      </form>
    </Form>
  );
};