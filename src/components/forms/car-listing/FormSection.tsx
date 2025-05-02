
/**
 * Form Section component for rendering a section of the car listing form
 * Updated 2025-06-05: Added id prop to fix TypeScript errors
 * Updated 2025-06-06: Added subtitle prop to support additional description text
 */

import React from 'react';

export interface FormSectionProps {
  title?: string;
  subtitle?: string;  // Added subtitle prop
  children: React.ReactNode;
  id?: string;
  right?: React.ReactNode;  // Added right prop for buttons or actions
}

export const FormSection = ({ title, subtitle, children, id, right }: FormSectionProps) => {
  return (
    <div id={id} className="space-y-4 p-4 bg-white rounded-md border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          {title && <h3 className="text-xl font-medium">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
};
