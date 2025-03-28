
/**
 * Changes made:
 * - Created standardized error display component for form fields
 * - Added animation for better user experience
 * - Enhanced error message formatting
 */

import React from "react";
import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormFieldErrorProps {
  error?: FieldError;
  className?: string;
}

export const FormFieldError = ({ error, className }: FormFieldErrorProps) => {
  if (!error) return null;

  return (
    <div
      className={cn(
        "text-sm font-medium text-destructive mt-1 animate-fadeIn",
        className
      )}
      role="alert"
    >
      {error.message}
    </div>
  );
};
