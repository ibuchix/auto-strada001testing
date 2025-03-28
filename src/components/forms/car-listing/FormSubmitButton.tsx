
/**
 * Changes made:
 * - Created reusable FormSubmitButton for consistent form submission UX
 * - Added loading state visualization
 * - Enhanced accessibility with proper ARIA attributes
 * - Fixed missing React import
 */

import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormSubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const FormSubmitButton = ({
  isSubmitting = false,
  loadingText = "Submitting...",
  children,
  className,
  ...props
}: FormSubmitButtonProps) => {
  return (
    <Button
      type="submit"
      className={`relative ${className}`}
      disabled={isSubmitting || props.disabled}
      aria-busy={isSubmitting}
      {...props}
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </Button>
  );
};
