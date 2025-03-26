
/**
 * A wrapper component for form sections
 */
import React, { ReactNode } from 'react';

interface FormSectionProps {
  children: ReactNode;
  className?: string;
}

export const FormSection = ({ children, className = '' }: FormSectionProps) => {
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};
