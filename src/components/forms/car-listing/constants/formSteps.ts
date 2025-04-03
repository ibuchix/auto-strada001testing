
/**
 * Changes made:
 * - 2024-08-08: Created form steps configuration for multi-step form
 * - 2027-07-25: Added component property to each step to fix TypeScript errors
 * - 2027-08-01: Ensured all step objects have consistent structure with required sections array
 * - 2027-08-15: Added requiredProps to each step for type-safe component rendering
 * - 2028-03-22: Updated to include validate functions and specific prop requirements
 * - 2028-05-30: Enhanced validation functions with specific section requirements
 * - 2028-06-10: Reorganized steps for more logical progression and better user flow
 * - 2027-11-19: Fixed validation function signature for TypeScript compatibility
 * - 2025-04-03: Consolidated multi-step form into 3 essential steps for better UX
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
import { VehicleDetailsSection } from "../sections/VehicleDetailsSection";
import { FinanceDetailsSection } from "../FinanceDetailsSection";
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
  // Step 1: Basic Vehicle Information & Photos
  {
    id: 'vehicle-details',
    title: 'Vehicle Details & Photos',
    sections: ['vehicle-details', 'photos', 'rims'],
    component: VehicleDetailsSection,
    requiredProps: ['form', 'carId'],
    description: 'Vehicle information and required photos',
    validate: (data: CarListingFormData) => {
      // Validate basic vehicle information
      const hasBasicInfo = Boolean(data.make?.trim()) && 
                          Boolean(data.model?.trim()) && 
                          Boolean(data.year) && 
                          Boolean(data.mileage) &&
                          Boolean(data.vin);
      
      // Validate photos
      const hasPhotos = Array.isArray(data.uploadedPhotos) && 
                        data.uploadedPhotos.length >= 3;
      
      // Validate rim photos if vehicle is registered in Poland
      const rimPhotosRequired = data.isRegisteredInPoland === true;
      const hasRimPhotos = data.rimPhotosComplete === true;
      
      return hasBasicInfo && hasPhotos && (!rimPhotosRequired || hasRimPhotos);
    }
  },
  
  // Step 2: Vehicle Condition & Features
  {
    id: 'vehicle-condition',
    title: 'Vehicle Condition & Features',
    sections: ['vehicle-status', 'features', 'damage', 'warning-lights', 'service-history', 'additional-info'],
    component: VehicleStatusSection,
    requiredProps: ['form', 'carId'],
    description: 'Condition, features, and history details',
    validate: (data: CarListingFormData) => {
      // Check if status fields have been filled
      const hasStatusInfo = data.isDamaged !== undefined && 
                          data.isRegisteredInPoland !== undefined;
      
      // Validate features
      const hasFeatures = data.features ? Object.values(data.features).some(Boolean) : false;
      
      // If vehicle is damaged, require damage description
      if (data.isDamaged && !data.damageDescription?.trim()) {
        return false;
      }
      
      // Validate service history
      const hasServiceHistory = Boolean(data.serviceHistoryType);
      
      // Validate additional information
      const hasAdditionalInfo = Boolean(data.numberOfKeys);
      
      return hasStatusInfo && hasFeatures && hasServiceHistory && hasAdditionalInfo;
    }
  },
  
  // Step 3: Seller Information & Terms
  {
    id: 'seller-details',
    title: 'Seller Details & Terms',
    sections: ['personal-details', 'finance-details', 'seller-notes'],
    component: PersonalDetailsSection,
    requiredProps: ['form'],
    description: 'Your information and selling terms',
    validate: (data: CarListingFormData) => {
      // Validate seller details
      const hasPersonalDetails = Boolean(data.name?.trim()) && 
                                Boolean(data.address?.trim()) && 
                                Boolean(data.mobileNumber?.trim());
      
      // Validate finance details if applicable
      const financeValid = data.hasOutstandingFinance 
        ? Boolean(data.financeAmount) && Boolean(data.financeProvider)
        : true;
      
      // Validate seller notes
      const hasNotes = Boolean(data.sellerNotes?.trim());
      
      return hasPersonalDetails && financeValid && hasNotes;
    }
  }
];
