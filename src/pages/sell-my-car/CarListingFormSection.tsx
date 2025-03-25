
/**
 * Changes made:
 * - 2027-07-22: Extracted from SellMyCar.tsx as part of component refactoring
 * - 2027-07-23: Added diagnostic logging to troubleshoot form loading issues
 */

import { useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { logDiagnostic, logStorageState } from "@/diagnostics/listingButtonDiagnostics";

interface CarListingFormSectionProps {
  pageId: string;
  renderCount: number;
  diagnosticId?: string;
}

export const CarListingFormSection = ({ 
  pageId, 
  renderCount,
  diagnosticId 
}: CarListingFormSectionProps) => {
  const sessionDiagnosticId = diagnosticId || pageId;
  
  useEffect(() => {
    logDiagnostic('FORM_SECTION', 'CarListingFormSection mounted', {
      pageId,
      renderCount,
      timestamp: new Date().toISOString()
    }, sessionDiagnosticId);
    
    logStorageState(sessionDiagnosticId, 'form_section_mount');
    
    return () => {
      logDiagnostic('FORM_SECTION', 'CarListingFormSection unmounted', {
        pageId,
        renderCount
      }, sessionDiagnosticId);
    };
  }, [pageId, renderCount, sessionDiagnosticId]);

  console.log(`SellMyCar[${pageId}] - Rendering form (valid state) - render #${renderCount}`);
  
  return (
    <PageLayout>
      <h1 className="text-5xl font-bold text-center mb-12">
        List Your Car
      </h1>
      <div className="max-w-2xl mx-auto">
        <CarListingForm diagnosticId={sessionDiagnosticId} />
      </div>
    </PageLayout>
  );
};
