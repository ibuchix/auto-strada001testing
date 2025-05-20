
/**
 * Form Section Renderer Component
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 */

import React from "react";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { FormSections } from "../FormSections";
import { FormSection } from "../FormSection";
import { FormSectionHeader } from "../FormSectionHeader";
import { CarListingFormData } from "@/types/forms";

interface FormSectionRendererProps {
  activeSections: string[];
  step: number;
}

export const FormSectionRenderer = ({ activeSections, step }: FormSectionRendererProps) => {
  const form = useFormContext<CarListingFormData>();
  
  const isValuationDriven = React.useMemo(() => {
    // Use form data or defaultValues to check if this is from valuation
    const formValues = form.getValues();
    return !!formValues.from_valuation;
  }, [form]);

  return (
    <div className="space-y-8 mb-8">
      {activeSections.map((sectionId, index) => {
        // Get the section component
        const SectionComponent = FormSections[sectionId];
        
        if (!SectionComponent) {
          console.warn(`No component found for section ID: ${sectionId}`);
          return null;
        }
        
        // Get metadata about the section
        const sectionMeta = Object.entries(FormSections).find(
          ([id]) => id === sectionId
        )?.[1];
        
        if (!sectionMeta) {
          return null;
        }
        
        // Skip sections that should be hidden when from valuation
        if (isValuationDriven && sectionMeta.hideWhenFromValuation) {
          return null;
        }
        
        return (
          <React.Fragment key={sectionId}>
            <FormSection id={sectionId} step={step} section={index + 1}>
              <FormSectionHeader
                title={sectionMeta.title}
                description={sectionMeta.description}
              />
              <SectionComponent />
            </FormSection>
            {index < activeSections.length - 1 && (
              <Separator className="my-6" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
