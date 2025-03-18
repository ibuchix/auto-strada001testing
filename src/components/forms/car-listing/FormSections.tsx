
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form sections component
 * - 2024-03-19: Added all required sections for car listing
 * - 2024-03-19: Implemented upload progress tracking
 * - 2024-08-08: Updated to conditionally render sections based on current step
 */

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
import { formSteps } from "./constants/formSteps";

interface FormSectionsProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
  uploadProgress: number;
  onProgressUpdate: (progress: number) => void;
  currentStep?: number;
}

export const FormSections = ({ 
  form, 
  carId, 
  uploadProgress, 
  onProgressUpdate,
  currentStep = 0
}: FormSectionsProps) => {
  const currentSections = formSteps[currentStep]?.sections || [];

  return (
    <div className="space-y-6">
      {/* Personal Details */}
      {currentSections.includes('personal-details') && (
        <div>
          <PersonalDetailsSection form={form} />
        </div>
      )}

      {/* Vehicle Status */}
      {currentSections.includes('vehicle-status') && (
        <div>
          <VehicleStatusSection form={form} />
        </div>
      )}

      {/* Damage Section */}
      {currentSections.includes('damage') && (
        <DamageSection form={form} carId={carId} />
      )}
      
      {/* Rim Photos Section */}
      {currentSections.includes('rims') && (
        <RimPhotosSection form={form} carId={carId} />
      )}
      
      {/* Warning Lights Section */}
      {currentSections.includes('warning-lights') && (
        <WarningLightsSection form={form} carId={carId} />
      )}

      {/* Features */}
      {currentSections.includes('features') && (
        <div>
          <FeaturesSection form={form} />
        </div>
      )}

      {/* Service History */}
      {currentSections.includes('service-history') && (
        <div>
          <ServiceHistorySection form={form} carId={carId} />
        </div>
      )}

      {/* Additional Information */}
      {currentSections.includes('additional-info') && (
        <div>
          <AdditionalInfoSection form={form} />
        </div>
      )}

      {/* Photos */}
      {currentSections.includes('photos') && (
        <div>
          <PhotoUploadSection 
            form={form} 
            carId={carId} 
            onProgressUpdate={onProgressUpdate}
          />
          <UploadProgress progress={uploadProgress} />
        </div>
      )}

      {/* Seller Notes */}
      {currentSections.includes('seller-notes') && (
        <div>
          <SellerNotesSection form={form} />
        </div>
      )}
    </div>
  );
};
