
/**
 * Form Section Component
 * Created: 2025-05-12
 * Purpose: Provides consistent layout for form sections
 */

import React from 'react';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
  id
}) => {
  return (
    <div id={id} className={`border-b border-gray-200 pb-8 mb-8 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export const FormLabel: React.FC<{children: React.ReactNode}> = ({children}) => {
  return (
    <div className="text-sm font-medium text-gray-700 mb-2">
      {children}
    </div>
  );
};
