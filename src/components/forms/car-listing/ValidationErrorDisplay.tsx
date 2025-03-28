
/**
 * Component to display validation errors in a structured format
 * - Shows field-specific error messages
 * - Provides easy navigation to error fields
 */

import { AlertCircle } from "lucide-react";

interface ValidationErrorDisplayProps {
  validationErrors: Record<string, string>;
}

export const ValidationErrorDisplay = ({ validationErrors }: ValidationErrorDisplayProps) => {
  if (Object.keys(validationErrors).length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Please correct the following errors:
          </h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {Object.entries(validationErrors).map(([field, message]) => (
              <li key={field} className="mt-1">
                <button 
                  type="button"
                  className="text-left underline hover:text-red-800 focus:outline-none"
                  onClick={() => {
                    const element = document.getElementById(field);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.focus();
                    }
                  }}
                >
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
