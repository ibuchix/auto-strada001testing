import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Card } from "@/components/ui/card";
import { PersonalDetailsSection } from "./PersonalDetailsSection";
import { VehicleStatusSection } from "./VehicleStatusSection";
import { FeaturesSection } from "./FeaturesSection";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { ServiceHistorySection } from "./ServiceHistorySection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { SellerNotesSection } from "./SellerNotesSection";
import { DamageSection } from "./DamageSection";
import { RimPhotosSection } from "./RimPhotosSection";
import { WarningLightsSection } from "./WarningLightsSection";
import { UploadProgress } from "./UploadProgress";

interface FormSectionsProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
  uploadProgress: number;
  onProgressUpdate: (progress: number) => void;
}

export const FormSections = ({ form, carId, uploadProgress, onProgressUpdate }: FormSectionsProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Personal Details</h2>
        <PersonalDetailsSection form={form} />
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Vehicle Status</h2>
        <VehicleStatusSection form={form} />
      </Card>

      <DamageSection form={form} carId={carId} />
      
      <RimPhotosSection form={form} carId={carId} />
      
      <WarningLightsSection form={form} carId={carId} />

      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Features</h2>
        <FeaturesSection form={form} />
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Service History</h2>
        <ServiceHistorySection form={form} carId={carId} />
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Additional Information</h2>
        <AdditionalInfoSection form={form} />
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Photos</h2>
        <PhotoUploadSection 
          form={form} 
          carId={carId} 
          onProgressUpdate={onProgressUpdate}
        />
        <UploadProgress progress={uploadProgress} />
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">Seller Notes</h2>
        <SellerNotesSection form={form} />
      </Card>
    </div>
  );
};