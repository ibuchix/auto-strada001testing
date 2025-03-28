
/**
 * Component to display a clear indication of required fields
 * Created: 2025-11-06
 */

import React from "react";

interface RequiredFieldsIndicatorProps {
  className?: string;
}

export const RequiredFieldsIndicator = ({ className = "" }: RequiredFieldsIndicatorProps) => {
  return (
    <div className={`text-sm text-gray-500 italic flex items-center gap-1 ${className}`}>
      <span className="text-[#DC143C] font-bold">*</span>
      <span>Required fields</span>
    </div>
  );
};
