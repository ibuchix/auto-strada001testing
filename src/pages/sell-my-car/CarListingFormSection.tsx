
/**
 * Changes made:
 * - Removed diagnostic-related code
 */

import { useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CarListingForm } from "@/components/forms/CarListingForm";

interface CarListingFormSectionProps {
  pageId: string;
  renderCount: number;
}

export const CarListingFormSection = ({ 
  pageId, 
  renderCount
}: CarListingFormSectionProps) => {
  useEffect(() => {
    console.log(`SellMyCar[${pageId}] - Rendering form (valid state) - render #${renderCount}`);
  }, [pageId, renderCount]);

  return (
    <PageLayout>
      <h1 className="text-5xl font-bold text-center mb-12">
        List Your Car
      </h1>
      <div className="max-w-2xl mx-auto">
        <CarListingForm />
      </div>
    </PageLayout>
  );
};
