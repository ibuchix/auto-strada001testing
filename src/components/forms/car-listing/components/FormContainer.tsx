
/**
 * FormContainer Component
 * Updated: 2025-05-24 - Fixed FormSectionRenderer props and structure
 * Updated: 2025-05-25 - Fixed TypeScript errors with section types
 * Updated: 2025-05-26 - Fixed name property issue with sections
 * Updated: 2025-05-27 - Fixed TypeScript errors with section casting
 */

import React from "react";
import { FormSection, FormSectionRenderer } from "./FormSectionRenderer";
import { FormStepHeader } from "../components/FormStepHeader";
import { formSteps } from "../constants/formSteps";

interface FormContainerProps {
  carId?: string;
  currentStep: number;
  activeSections: string[];
}

export const FormContainer = ({
  carId,
  currentStep,
  activeSections
}: FormContainerProps) => {
  // Get the current step's sections
  const currentStepData = formSteps[currentStep - 1] || formSteps[0];
  
  // Filter out sections that should be active based on their name property
  // and ensure they're properly typed as FormSection objects
  const visibleSections = currentStepData.sections.filter(section => 
    typeof section === 'object' && 
    'name' in section && 
    section.name && 
    activeSections.includes(section.name)
  ) as FormSection[];
  
  return (
    <div className="space-y-8">
      <FormStepHeader 
        title={currentStepData.title}
        description={currentStepData.description}
      />
      
      <FormSectionRenderer sections={visibleSections} />
    </div>
  );
};
