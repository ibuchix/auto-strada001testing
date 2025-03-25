
/**
 * Changes made:
 * - 2027-07-22: Extracted from SellMyCar.tsx as part of component refactoring
 */

import { PageLayout } from "@/components/layout/PageLayout";
import { CarListingForm } from "@/components/forms/CarListingForm";

interface CarListingFormSectionProps {
  pageId: string;
  renderCount: number;
}

export const CarListingFormSection = ({ pageId, renderCount }: CarListingFormSectionProps) => {
  console.log(`SellMyCar[${pageId}] - Rendering form (valid state) - render #${renderCount}`);
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
