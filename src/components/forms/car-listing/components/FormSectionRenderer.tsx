
/**
 * Form Section Renderer component
 * Created: 2025-06-07
 * Maps section IDs to their appropriate component implementations
 * Updated: 2025-06-08: Added ReservePriceSection component
 * Updated: 2025-06-12: Fixed FormDataContext usage and error handling
 * Updated: 2025-07-18: Fixed incorrect component import paths
 */

import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { VehicleDetailsSection } from '../sections/VehicleDetailsSection';
import { VehicleStatusSection } from '../sections/VehicleStatusSection';
import { DamageDetailsSection } from '../sections/DamageDetailsSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { ServiceHistorySection } from '../sections/ServiceHistorySection';
import { PersonalDetailsSection } from '../sections/PersonalDetailsSection';
import { SellerNotesSection } from '../sections/SellerNotesSection';
import { AdditionalInfoSection } from '../AdditionalInfoSection';
import { ImageUploadSection } from './ImageUploadSection';
import { ReservePriceSection } from '../sections/ReservePriceSection';
import { FinanceDetailsSection } from '../FinanceDetailsSection';

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
  try {
    // Using useFormData hook to get form context
    const { form } = useFormData();
    
    if (!form) {
      console.error("Form not available in FormSectionRenderer");
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
        
      case 'reserve-price':
        return <ReservePriceSection />;
        
      case 'finance-details':
        return <FinanceDetailsSection carId={carId} />;
        
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
  } catch (error) {
    console.error(`Error rendering section ${sectionId}:`, error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
        <h3 className="font-semibold">Error rendering form section</h3>
        <p>There was an error loading this section of the form. Please try refreshing the page.</p>
        <p className="text-xs mt-2">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
};
