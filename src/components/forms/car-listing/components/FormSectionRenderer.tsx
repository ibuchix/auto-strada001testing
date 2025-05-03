
/**
 * Form Section Renderer component
 * Created: 2025-06-07
 * Maps section IDs to their appropriate component implementations
 * Updated: 2025-06-08: Added ReservePriceSection component
 * Updated: 2025-06-12: Fixed FormDataContext usage and error handling
 * Updated: 2025-07-18: Fixed incorrect component import paths
 * Updated: 2025-07-26: Fixed component imports and added missing sections
 * Updated: 2025-07-27: Fixed PhotosSection props to match component definition
 * Updated: 2025-08-23: Modified to skip pricing section if not from valuation
 */

import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { BasicInfoSection } from "../BasicInfoSection";
import { ConditionSection } from "../sections/ConditionSection";
import { DamagePhotosSection } from "../DamagePhotosSection";
import { FeaturesSection } from "../sections/FeaturesSection";
import { ServiceHistorySection } from "../ServiceHistorySection";
import { PhotosSection } from "../sections/PhotosSection";
import { SellerNotesSection } from "../SellerNotesSection";
import { AdditionalInfoSection } from "../AdditionalInfoSection";
import { FinanceDetailsSection } from "../FinanceDetailsSection";
import { PricingSection } from "../sections/PricingSection";

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

    // Check if the form is from valuation - needed to determine if we show pricing
    const fromValuation = form.getValues('fromValuation') || Boolean(form.getValues('valuation_data'));

    // Map section IDs to their component implementations
    switch (sectionId) {
      case 'car-details':
      case 'vehicle-info':
        return <BasicInfoSection />;
        
      case 'vehicle-status':
      case 'condition':
        return <ConditionSection />;
        
      case 'damage-photos':
      case 'damage-details':
        return <DamagePhotosSection />;
        
      case 'features':
        return <FeaturesSection />;
        
      case 'service-history':
        return <ServiceHistorySection />;
        
      case 'photos':
        return (
          <PhotosSection carId={carId} />
        );
        
      case 'seller-notes':
        return <SellerNotesSection />;
        
      case 'additional-info':
        return <AdditionalInfoSection />;
        
      case 'finance-details':
        return <FinanceDetailsSection carId={carId} />;

      case 'pricing':
        // Only show pricing section if coming from valuation
        if (fromValuation) {
          return <PricingSection />;
        }
        // If not from valuation, render information message instead
        return (
          <div className="p-4 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            <h3 className="font-semibold mb-2">Vehicle Pricing</h3>
            <p>Vehicle pricing is determined based on valuation data. Please complete a vehicle valuation first to receive pricing information.</p>
          </div>
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
