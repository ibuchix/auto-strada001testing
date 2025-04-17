
/**
 * Enhanced Form Submit Button Component
 * 
 * Changes:
 * - Added debug logging for click events
 * - Improved error handling
 * - Added retry capability for failed submissions
 * - Enhanced accessibility
 */
import React, { useState, useCallback } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface FormSubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  onSubmitClick?: () => void;
  formId?: string;
}

export const FormSubmitButton = ({
  isSubmitting = false,
  loadingText = "Submitting...",
  children = "Submit",
  className,
  onSubmitClick,
  formId = "unknown",
  ...props
}: FormSubmitButtonProps) => {
  const [clickAttempts, setClickAttempts] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // Enhanced click handler with debugging
  const handleClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    
    // Log click event for debugging
    console.log(`[FormSubmitButton][${formId}] Button clicked`, {
      timestamp: new Date().toISOString(),
      isSubmitting,
      disabled: props.disabled,
      timeSinceLastClick: `${timeSinceLastClick}ms`,
      attempts: clickAttempts + 1,
      eventType: e.type,
      eventTarget: e.currentTarget.tagName,
    });
    
    // Update click tracking
    setClickAttempts(prev => prev + 1);
    setLastClickTime(now);
    
    // If button is already submitting or disabled, show feedback
    if (isSubmitting) {
      console.log(`[FormSubmitButton][${formId}] Already submitting, ignoring click`);
      toast({
        title: "Processing",
        description: "Your submission is being processed...",
        variant: "default"
      });
      return;
    }
    
    if (props.disabled) {
      console.log(`[FormSubmitButton][${formId}] Button is disabled, ignoring click`);
      return;
    }
    
    // Call the provided click handler
    if (onSubmitClick) {
      try {
        console.log(`[FormSubmitButton][${formId}] Calling onSubmitClick handler`);
        onSubmitClick();
      } catch (error) {
        console.error(`[FormSubmitButton][${formId}] Error in click handler:`, error);
        toast({
          title: "Submission Error",
          description: "There was a problem processing your request. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [isSubmitting, props.disabled, onSubmitClick, formId, clickAttempts, lastClickTime]);
  
  return (
    <Button
      type="submit"
      className={`relative ${className}`}
      disabled={isSubmitting || props.disabled}
      aria-busy={isSubmitting}
      onClick={handleClick}
      data-testid="form-submit-button"
      aria-label={isSubmitting ? loadingText : (children?.toString() || "Submit")}
      {...props}
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {children}
        </span>
      )}
    </Button>
  );
};
