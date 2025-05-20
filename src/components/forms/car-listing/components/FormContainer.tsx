
/**
 * FormContainer Component
 * Created: 2025-05-24 - Created component to display form content with proper layout
 * Updated: 2025-05-26 - Fixed TypeScript errors with section types
 * Updated: 2025-05-28 - Fixed issues with section handling and null checks
 */

import React from "react";
import { FormSectionRenderer, FormSection } from "./FormSectionRenderer";
import { FormStepHeader } from "./FormStepHeader";

interface FormContainerProps {
  title: string;
  description?: string;
  sections: FormSection[] | string[];
}

export const FormContainer = ({ title, description, sections }: FormContainerProps) => {
  // Transform string section names to FormSection objects if needed
  const formattedSections: FormSection[] = sections.map((section) => {
    if (typeof section === 'string') {
      // This is a string, convert it to a FormSection
      return {
        name: section,
        // This is just a placeholder, actual component will be resolved during rendering
        component: () => <div>Section placeholder for {section}</div>
      };
    }
    // Already a FormSection object
    return section as FormSection;
  });

  return (
    <div className="space-y-8">
      <FormStepHeader title={title} description={description} />
      <FormSectionRenderer sections={formattedSections} />
    </div>
  );
};
