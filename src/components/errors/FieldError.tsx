
/**
 * FieldError component for form field validation errors
 * Created: 2025-04-05
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ 
  message, 
  className = '' 
}) => {
  if (!message) return null;
  
  return (
    <div className={`text-[#DC143C] text-sm flex items-start gap-1.5 mt-1.5 ${className}`}>
      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};
