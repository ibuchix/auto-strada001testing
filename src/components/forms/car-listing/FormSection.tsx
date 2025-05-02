
/**
 * Form Section component for rendering a section of the car listing form
 * Updated 2025-06-05: Added id prop to fix TypeScript errors
 * Updated 2025-06-06: Added subtitle prop to support additional description text
 * Updated 2025-06-07: Fixed TypeScript definitions to properly include all props
 * Updated 2025-06-07: Enhanced visual styling with improved spacing and border colors
 */

import React from 'react';

export interface FormSectionProps {
  title?: string;
  subtitle?: string;  // Added subtitle prop
  children: React.ReactNode;
  id?: string;
  right?: React.ReactNode;  // Added right prop for buttons or actions
  className?: string;
}

export const FormSection = ({ 
  title, 
  subtitle, 
  children, 
  id, 
  right,
  className = ''
}: FormSectionProps) => {
  return (
    <div 
      id={id} 
      className={`space-y-4 p-5 bg-white rounded-md border border-gray-200 shadow-sm transition-all hover:border-gray-300 ${className}`}
    >
      <div className="flex justify-between items-center">
        <div>
          {title && <h3 className="text-lg font-medium text-gray-800">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
};
