
/**
 * Form Container Component
 * Updated: 2025-05-20 - Fixed FormSectionRenderer props
 */

import React from "react";
import { FormSectionRenderer } from "./FormSectionRenderer";

interface FormContainerProps {
  sectionId?: string;
  carId?: string;
  step?: number;
  activeSections?: string[];
}

export const FormContainer: React.FC<FormContainerProps> = ({
  sectionId,
  carId,
  activeSections = [],
  step = 1
}) => {
  return (
    <div className="space-y-4">
      <FormSectionRenderer 
        sectionId={sectionId} 
        carId={carId} 
        activeSections={activeSections}
        step={step}
      />
    </div>
  );
};
