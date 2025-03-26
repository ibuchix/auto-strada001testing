
/**
 * Changes made:
 * - 2024-08-08: Created form steps configuration for multi-step form
 * - 2027-07-25: Added component property to each step to fix TypeScript errors
 * - 2027-08-01: Ensured all step objects have consistent structure with required sections array
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

export const formSteps = [
  {
    id: 'personal-details',
    title: 'Personal Details',
    sections: ['personal-details'],
    component: PersonalDetailsSection
  },
  {
    id: 'vehicle-status',
    title: 'Vehicle Status',
    sections: ['vehicle-status', 'damage', 'warning-lights'],
    component: VehicleStatusSection
  },
  {
    id: 'features',
    title: 'Vehicle Features',
    sections: ['features', 'service-history'],
    component: FeaturesSection
  },
  {
    id: 'additional-info',
    title: 'Additional Information',
    sections: ['additional-info'],
    component: AdditionalInfoSection
  },
  {
    id: 'photos',
    title: 'Vehicle Photos',
    sections: ['photos'],
    component: PhotoUploadSection
  },
  {
    id: 'notes',
    title: 'Seller Notes',
    sections: ['seller-notes'],
    component: SellerNotesSection
  },
  {
    id: 'rims',
    title: 'Rim Condition',
    sections: ['rims'], // Add sections array to fix type error
    component: RimPhotosSection,
    description: 'Upload photos of all four rims'
  },
  {
    id: 'service-history',
    title: 'Service History',
    sections: ['service-history'], // Add sections array to fix type error
    component: ServiceHistorySection,
    description: 'Provide service history details and documents'
  }
];
