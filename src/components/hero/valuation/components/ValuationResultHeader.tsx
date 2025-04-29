
/**
 * ValuationResultHeader component for displaying the header section
 * Created: 2025-04-29
 */

import React from "react";

interface ValuationResultHeaderProps {
  title: string;
}

export const ValuationResultHeader: React.FC<ValuationResultHeaderProps> = ({
  title
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
};
