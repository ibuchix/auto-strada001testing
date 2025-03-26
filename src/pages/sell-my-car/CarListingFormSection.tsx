
/**
 * Fix for diagnostic import
 */

import { useEffect } from "react";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { Card, CardContent } from "@/components/ui/card";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface CarListingFormSectionProps {
  diagnosticId?: string;
}

export const CarListingFormSection = ({ diagnosticId }: CarListingFormSectionProps) => {
  useEffect(() => {
    if (diagnosticId) {
      logDiagnostic(
        'FORM_SECTION_LOAD',
        'Car listing form section loaded',
        {
          timestamp: new Date().toISOString(),
          url: window.location.href
        },
        diagnosticId
      );
    }
  }, [diagnosticId]);

  return (
    <Card className="shadow-lg border-t-4 border-t-primary">
      <CardContent className="p-0 sm:p-2">
        <CarListingForm diagnosticId={diagnosticId} />
      </CardContent>
    </Card>
  );
};
