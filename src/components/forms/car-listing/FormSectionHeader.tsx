
/**
 * A component for displaying section headers in the car listing form
 */
import React from 'react';

interface FormSectionHeaderProps {
  title: string;
  description?: string;
}

export const FormSectionHeader = ({ title, description }: FormSectionHeaderProps) => {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600">{description}</p>
      )}
    </div>
  );
};
