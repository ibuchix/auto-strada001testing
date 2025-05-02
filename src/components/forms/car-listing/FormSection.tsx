
/**
 * Form Section component for rendering a section of the car listing form
 * Updated 2025-06-05: Added id prop to fix TypeScript errors
 */

import React from 'react';

export interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  id?: string;  // Added id prop
}

export const FormSection = ({ title, children, id }: FormSectionProps) => {
  return (
    <div id={id} className="space-y-4 p-4 bg-white rounded-md border border-gray-100 shadow-sm">
      {title && <h3 className="text-xl font-medium">{title}</h3>}
      {children}
    </div>
  );
};
