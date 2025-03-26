
/**
 * Updated FormSectionHeader to include subtitle prop and better spacing
 */
import React, { ReactNode } from 'react';

export interface FormSectionHeaderProps {
  title: string;
  description?: string;
  subtitle?: string; // Added subtitle prop
  right?: ReactNode; // Added right element prop
}

export const FormSectionHeader = ({ 
  title, 
  description, 
  subtitle,
  right 
}: FormSectionHeaderProps) => {
  return (
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        {subtitle && (
          <p className="text-gray-600 text-sm mb-1">{subtitle}</p>
        )}
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      {right && (
        <div>
          {right}
        </div>
      )}
    </div>
  );
};
