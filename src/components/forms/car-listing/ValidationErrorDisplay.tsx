
import { memo } from 'react';
import { AlertCircle } from "lucide-react";

interface ValidationErrorDisplayProps {
  errors: string[];
}

export const ValidationErrorDisplay = memo(({ errors = [] }: ValidationErrorDisplayProps) => {
  // Don't render anything if there are no errors
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <h3 className="font-medium">Please fix the following errors:</h3>
      </div>
      <ul className="mt-2 ml-6 list-disc text-sm">
        {errors.map((error, index) => (
          <li key={`error-${index}`}>{error}</li>
        ))}
      </ul>
    </div>
  );
});

// Add display name for better debugging
ValidationErrorDisplay.displayName = 'ValidationErrorDisplay';
