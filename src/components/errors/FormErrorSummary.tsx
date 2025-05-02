
/**
 * FormErrorSummary component for displaying multiple validation errors
 * Created: 2025-04-05
 * Updated: 2025-06-16 - Fixed ValidationError type usage
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ValidationError } from '@/errors/classes';

interface ValidationErrorWithField extends ValidationError {
  field?: string;
}

interface FormErrorSummaryProps {
  errors: ValidationErrorWithField[] | Record<string, string> | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  title = 'Validation Error',
  onRetry,
  className = '',
  showDetails = true
}) => {
  // Don't render if no errors
  if (!errors || (Array.isArray(errors) && errors.length === 0) || 
      (!Array.isArray(errors) && Object.keys(errors).length === 0)) {
    return null;
  }
  
  // Convert record to array format for consistent rendering
  const errorArray = Array.isArray(errors) 
    ? errors 
    : Object.entries(errors).map(([field, message]) => {
        const error = new ValidationError({ message });
        (error as ValidationErrorWithField).field = field;
        return error as ValidationErrorWithField;
      });
  
  return (
    <Alert variant="destructive" className={`mb-6 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>Please fix the following issues to proceed:</p>
        
        {showDetails && (
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
            {errorArray.map((error, index) => (
              <li key={index}>
                {(error as ValidationErrorWithField).field ? (
                  <span>
                    <strong>{formatFieldName((error as ValidationErrorWithField).field || '')}</strong>: {error.message}
                  </span>
                ) : (
                  error.message
                )}
              </li>
            ))}
          </ul>
        )}
        
        {onRetry && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              className="text-white bg-[#DC143C]/80 hover:bg-[#DC143C] border-[#DC143C]/30"
            >
              Fix Issues
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Helper to format field names for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/Id$/, 'ID') // Fix ID suffix
    .trim();
}
