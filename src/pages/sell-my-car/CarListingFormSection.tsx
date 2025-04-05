
/**
 * Changes made:
 * - 2025-04-12: Added support for direct navigation from valuation
 * - 2025-04-12: Enhanced data loading reliability
 */

import { CarListingForm } from "@/components/forms/CarListingForm";
import { PageLayout } from "@/components/layout/PageLayout";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface CarListingFormSectionProps {
  pageId: string;
  renderCount: number;
  fromValuation?: boolean;
}

export const CarListingFormSection = ({ 
  pageId, 
  renderCount,
  fromValuation = false
}: CarListingFormSectionProps) => {
  const location = useLocation();
  const fromLocationState = location.state?.fromValuation;
  const hasValuationData = fromValuation || fromLocationState;
  
  // Log component mount for debugging
  useEffect(() => {
    console.log('CarListingFormSection mounted', {
      pageId,
      renderCount,
      fromValuation,
      fromLocationState,
      hasLocationState: !!location.state,
      timestamp: new Date().toISOString()
    });
  }, [pageId, renderCount, fromValuation, fromLocationState, location.state]);

  return (
    <PageLayout>
      <div className="pb-20">
        <h1 className="text-3xl font-bold mb-6">List Your Car</h1>
        <p className="text-gray-600 mb-8">
          {hasValuationData 
            ? "We've prepared your car listing based on the valuation data. Please complete the form to list your car."
            : "Please fill out this form to list your car for auction."
          }
        </p>
        <CarListingForm />
      </div>
    </PageLayout>
  );
};
