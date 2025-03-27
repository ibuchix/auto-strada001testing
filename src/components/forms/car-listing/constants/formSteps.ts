
/**
 * Changes made:
 * - 2024-08-08: Created form steps configuration for multi-step form
 * - 2027-07-25: Added component property to each step to fix TypeScript errors
 * - 2027-08-01: Ensured all step objects have consistent structure with required sections array
 * - 2027-08-15: Added requiredProps to each step for type-safe component rendering
 * - 2028-03-22: Updated to include validate functions and specific prop requirements
 */

import { PersonalDetailsSection } from "../PersonalDetailsSection";
import { VehicleStatusSection } from "../VehicleStatusSection";
import { FeaturesSection } from "../FeaturesSection";
import { DamageSection } from "../DamageSection";
import { RimPhotosSection } from "../RimPhotosSection";
import { WarningLightsSection } from "../WarningLightsSection";
import { ServiceHistorySection } from "../ServiceHistorySection";
import { AdditionalInfoSection } from "../AdditionalInfoSection";
import { PhotoUploadSection } from "../PhotoUploadSection";
import { SellerNotesSection } from "../SellerNotesSection";
import { CarListingFormData } from "@/types/forms";

// Define FormStep type for better type safety
export type FormStep = {
  id: string;
  title: string;
  sections: string[];
  component: React.ComponentType<any>;
  requiredProps: string[];
  description?: string;
  validate?: (data: CarListingFormData) => boolean;
};

export const formSteps: FormStep[] = [
  {
    id: 'personal-details',
    title: 'Personal Details',
    sections: ['personal-details'],
    component: PersonalDetailsSection,
    requiredProps: ['form'],
    validate: (data: CarListingFormData) => 
      !!data.name && !!data.email && !!data.phone && !!data.address
  },
  {
    id: 'vehicle-status',
    title: 'Vehicle Status',
    sections: ['vehicle-status', 'damage', 'warning-lights'],
    component: VehicleStatusSection,
    requiredProps: ['form'],
    validate: (data: CarListingFormData) => 
      !!data.make && !!data.model && !!data.year && !!data.mileage
  },
  {
    id: 'features',
    title: 'Vehicle Features',
    sections: ['features', 'service-history'],
    component: FeaturesSection,
    requiredProps: ['form'],
    validate: (data: CarListingFormData) => 
      Object.values(data.features || {}).some(Boolean)
  },
  {
    id: 'additional-info',
    title: 'Additional Information',
    sections: ['additional-info'],
    component: AdditionalInfoSection,
    requiredProps: ['form'],
    validate: (data: CarListingFormData) => 
      !!data.seatMaterial && !!data.numberOfKeys
  },
  {
    id: 'photos',
    title: 'Vehicle Photos',
    sections: ['photos'],
    component: PhotoUploadSection,
    requiredProps: ['form', 'carId'],
    validate: (data: CarListingFormData) => 
      Array.isArray(data.uploadedPhotos) && data.uploadedPhotos.length >= 3
  },
  {
    id: 'notes',
    title: 'Seller Notes',
    sections: ['seller-notes'],
    component: SellerNotesSection,
    requiredProps: ['form'],
    validate: (data: CarListingFormData) => 
      !!data.sellerNotes
  },
  {
    id: 'rims',
    title: 'Rim Condition',
    sections: ['rims'],
    component: RimPhotosSection,
    description: 'Upload photos of all four rims',
    requiredProps: ['form', 'carId'],
    validate: (data: CarListingFormData) => 
      !!data.frontLeftRimPhoto && !!data.frontRightRimPhoto && 
      !!data.rearLeftRimPhoto && !!data.rearRightRimPhoto
  },
  {
    id: 'service-history',
    title: 'Service History',
    sections: ['service-history'],
    component: ServiceHistorySection,
    description: 'Provide service history details and documents',
    requiredProps: ['form', 'carId'],
    validate: (data: CarListingFormData) => 
      !!data.serviceHistoryType
  }
];
