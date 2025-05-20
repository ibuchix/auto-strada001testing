
/**
 * FormStepHeader Component
 * Created: 2025-05-27
 * Displays the title and description for the current form step
 */

import React from "react";

interface FormStepHeaderProps {
  title: string;
  description?: string;
}

export const FormStepHeader = ({ title, description }: FormStepHeaderProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      {description && <p className="text-gray-500 mt-1">{description}</p>}
    </div>
  );
};
