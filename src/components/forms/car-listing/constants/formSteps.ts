
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
  // Step 1: Basic vehicle information
  {
    id: 'vehicle-details',
    title: 'Vehicle Details',
    sections: ['vehicle-details'],
    component: VehicleDetailsSection,
    requiredProps: ['form'],
    description: 'Basic information about your vehicle',
    validate: (data: CarListingFormData) => 
      Boolean(data.make?.trim()) && 
      Boolean(data.model?.trim()) && 
      Boolean(data.year) && 
      Boolean(data.mileage)
  },
  
  // Step 2: Vehicle status and condition
  {
    id: 'vehicle-status',
    title: 'Vehicle Status',
    sections: ['vehicle-status', 'damage', 'warning-lights'],
    component: VehicleStatusSection,
    requiredProps: ['form'],
    description: 'Current status and condition of your vehicle',
    validate: (data: CarListingFormData) => {
      // Check if status fields have been filled
      const statusFields = data.isDamaged !== undefined && 
                          data.isRegisteredInPoland !== undefined;
                          
      // If vehicle is damaged, require damage description
      if (data.isDamaged && !data.damageDescription?.trim()) {
        return false;
      }
      
      return statusFields;
    }
  },
  
  // Step 3: Features and specifications
  {
    id: 'features',
    title: 'Vehicle Features',
    sections: ['features'],
    component: FeaturesSection,
    requiredProps: ['form'],
    description: 'Features and specifications of your vehicle',
    validate: (data: CarListingFormData) => 
      data.features ? Object.values(data.features).some(Boolean) : false
  },
  
  // Step 4: Service history and maintenance
  {
    id: 'service-history',
    title: 'Service History',
    sections: ['service-history'],
    component: ServiceHistorySection,
    description: 'Service history and maintenance records',
    requiredProps: ['form', 'carId'],
    validate: (data: CarListingFormData) => 
      Boolean(data.serviceHistoryType)
  },
  
  // Step 5: Additional information
  {
    id: 'additional-info',
    title: 'Additional Details',
    sections: ['additional-info'],
    component: AdditionalInfoSection,
    requiredProps: ['form'],
    description: 'Additional details about your vehicle',
    validate: (data: CarListingFormData) => 
      Boolean(data.seatMaterial) && 
      Boolean(data.numberOfKeys)
  },
  
  // Step 6: Vehicle condition details
  {
    id: 'rims',
    title: 'Vehicle Condition',
    sections: ['rims'],
    component: RimPhotosSection,
    description: 'Detailed condition information including wheels',
    requiredProps: ['form', 'carId'],
    validate: (data: CarListingFormData) => {
      // If vehicle is registered, require rim photos 
      // If not registered, this section is optional
      if (data.isRegisteredInPoland) {
        return Boolean(data.frontLeftRimPhoto) && 
               Boolean(data.frontRightRimPhoto) && 
               Boolean(data.rearLeftRimPhoto) && 
               Boolean(data.rearRightRimPhoto);
      }
      return true;
    }
  },
  
  // Step 7: Photos of the vehicle
  {
    id: 'photos',
    title: 'Vehicle Photos',
    sections: ['photos'],
    component: PhotoUploadSection,
    requiredProps: ['form', 'carId'],
    description: 'Upload photos of your vehicle',
    validate: (data: CarListingFormData) => 
      Array.isArray(data.uploadedPhotos) && 
      data.uploadedPhotos.length >= 3
  },
  
  // Step 8: Financial information (if applicable)
  {
    id: 'finance',
    title: 'Finance Details',
    sections: ['finance-details'],
    component: FinanceDetailsSection,
    requiredProps: ['form'],
    description: 'Financial information about your vehicle',
    validate: (data: CarListingFormData) => {
      // Only require finance details if hasOutstandingFinance is true
      if (data.hasOutstandingFinance) {
        return Boolean(data.financeAmount) && Boolean(data.financeProvider);
      }
      return true;
    }
  },
  
  // Step 9: Seller details
  {
    id: 'personal-details',
    title: 'Seller Details',
    sections: ['personal-details'],
    component: PersonalDetailsSection,
    requiredProps: ['form'],
    description: 'Your contact information',
    validate: (data: CarListingFormData) => 
      Boolean(data.name?.trim()) && 
      Boolean(data.address?.trim()) && 
      Boolean(data.mobileNumber?.trim())
  },
  
  // Step 10: Final notes and submission
  {
    id: 'notes',
    title: 'Seller Notes',
    sections: ['seller-notes'],
    component: SellerNotesSection,
    requiredProps: ['form'],
    description: 'Additional notes for potential buyers',
    validate: (data: CarListingFormData) => 
      Boolean(data.sellerNotes?.trim())
  }
];
