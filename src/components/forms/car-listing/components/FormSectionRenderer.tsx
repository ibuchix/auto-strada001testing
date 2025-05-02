
/**
 * Form Section Renderer component
 * Created: 2025-06-07
 * Maps section IDs to their appropriate component implementations
 */

import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { VehicleDetailsSection } from '../sections/VehicleDetailsSection';
import { VehicleStatusSection } from '../sections/VehicleStatusSection';
import { DamageDetailsSection } from '../sections/DamageDetailsSection';
import { FeaturesSection } from '../FeaturesSection';
import { ServiceHistorySection } from '../sections/ServiceHistorySection';
import { PersonalDetailsSection } from '../sections/PersonalDetailsSection';
import { SellerNotesSection } from '../SellerNotesSection';
import { AdditionalInfoSection } from '../AdditionalInfoSection';
import { ImageUploadSection } from './ImageUploadSection';

interface FormSectionRendererProps {
  sectionId: string;
  pauseAutoSave?: () => void;
  resumeAutoSave?: () => void;
  carId?: string;
}

export const FormSectionRenderer = ({ 
  sectionId,
  pauseAutoSave,
  resumeAutoSave,
  carId
}: FormSectionRendererProps) => {
  const { form } = useFormData();
  
  if (!form) {
    console.error("Form context not available in FormSectionRenderer");
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Form context not available. Please refresh the page.
      </div>
    );
  }

  // Map section IDs to their component implementations
  switch (sectionId) {
    case 'vehicle-info':
      return <VehicleDetailsSection />;
      
    case 'vehicle-status':
      return <VehicleStatusSection />;
      
    case 'damage-details':
      return <DamageDetailsSection />;
      
    case 'features':
      return <FeaturesSection />;
      
    case 'service-history':
      return <ServiceHistorySection />;
      
    case 'personal-details':
      return <PersonalDetailsSection />;
      
    case 'seller-notes':
      return <SellerNotesSection />;
      
    case 'additional-info':
      return <AdditionalInfoSection />;
      
    case 'images':
      return (
        <ImageUploadSection 
          maxImages={10}
          carId={carId}
          pauseAutoSave={pauseAutoSave}
          resumeAutoSave={resumeAutoSave}
        />
      );
      
    default:
      return (
        <div className="p-4 bg-amber-50 text-amber-600 rounded-md">
          Unknown section: {sectionId}
        </div>
      );
  }
};
