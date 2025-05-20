
/**
 * FormContainer Component
 * Updated: 2025-05-24 - Fixed FormSectionRenderer props and structure
 * Updated: 2025-05-25 - Fixed TypeScript errors with section types
 */

import React from "react";
import { FormSection } from "../FormSection";
import { FormStepHeader } from "./FormStepHeader";
import { FormSectionRenderer } from "./FormSectionRenderer";
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
  const visibleSections = currentStepData.sections.filter(section => 
    activeSections.includes(section.name)
  );
  
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
