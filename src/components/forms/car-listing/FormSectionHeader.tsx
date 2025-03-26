
/**
 * Simple section header for form sections
 */
import React from 'react';

interface FormSectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export const FormSectionHeader = ({ title, subtitle, right }: FormSectionHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
};
