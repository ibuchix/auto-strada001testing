
/**
 * FormStepHeader Component
 * Created: 2025-05-24 - Added to support structured form header display
 */

import React from "react";

interface FormStepHeaderProps {
  title: string;
  description?: string;
}

export const FormStepHeader = ({ title, description }: FormStepHeaderProps) => {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-dark">{title}</h2>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
};
