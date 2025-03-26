
/**
 * Wrapper component for form sections
 */
import React from 'react';

interface FormSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({ children, className = '' }: FormSectionProps) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
};
