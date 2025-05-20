
/**
 * FormSectionRenderer Component
 * Updated: 2025-05-24 - Created component to render form sections dynamically
 * Updated: 2025-05-26 - Fixed TypeScript errors with section types
 * Updated: 2025-05-27 - Removed next/dynamic import and fixed TypeScript errors
 */

import React from "react";
import { ComponentType } from "react";

// Section interfaces
export interface FormSection {
  name: string;
  component: ComponentType<any>;
  condition?: (data: any) => boolean;
}

interface FormSectionRendererProps {
  sections: FormSection[];
}

export const FormSectionRenderer = ({ sections }: FormSectionRendererProps) => {
  if (!sections || sections.length === 0) {
    return <div className="text-gray-500">No sections available for this step</div>;
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const SectionComponent = section.component;
        
        return (
          <div key={section.name} className="border rounded-lg p-6 bg-white shadow-sm">
            <SectionComponent />
          </div>
        );
      })}
    </div>
  );
};
