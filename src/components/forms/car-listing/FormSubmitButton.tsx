
/**
 * Enhanced Form Submit Button Component
 * 
 * Changes:
 * - Added debug logging for click events
 * - Improved error handling
 * - Added retry capability for failed submissions
 * - Enhanced accessibility
 * - 2025-04-17: Fixed toast import path
 * - 2025-05-24: Added enhanced loading states and upload verification
 */
import React, { useState, useCallback, useEffect } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FormSubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  onSubmitClick?: () => void;
  formId?: string;
  onVerifyUploads?: () => Promise<boolean>;
}

export const FormSubmitButton = ({
  isSubmitting = false,
  loadingText = "Submitting...",
  children = "Submit",
  className,
  onSubmitClick,
  formId = "unknown",
  onVerifyUploads,
  ...props
}: FormSubmitButtonProps) => {
  const [clickAttempts, setClickAttempts] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [verifyingUploads, setVerifyingUploads] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<'idle' | 'verifying' | 'uploading' | 'submitting'>('idle');
  
  // Reset submission phase when isSubmitting changes to false
  useEffect(() => {
    if (!isSubmitting && submissionPhase !== 'idle') {
      setSubmissionPhase('idle');
    }
  }, [isSubmitting]);
  
  // Enhanced click handler with upload verification
  const handleClick = useCallback(async (e: React.MouseEvent) => {
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
    
    // If button is already in a loading state, show feedback
    if (isSubmitting || verifyingUploads) {
      console.log(`[FormSubmitButton][${formId}] Already processing, ignoring click`);
      toast({
        title: "Processing",
        description: `Your submission is being ${submissionPhase}. Please wait...`
      });
      return;
    }
    
    if (props.disabled) {
      console.log(`[FormSubmitButton][${formId}] Button is disabled, ignoring click`);
      return;
    }
    
    // Verify uploads if handler is provided
    if (onVerifyUploads) {
      try {
        setVerifyingUploads(true);
        setSubmissionPhase('verifying');
        
        console.log(`[FormSubmitButton][${formId}] Verifying uploads before submission`);
        const uploadsComplete = await onVerifyUploads();
        
        if (!uploadsComplete) {
          console.log(`[FormSubmitButton][${formId}] Uploads not complete, aborting submission`);
          toast({
            variant: "destructive",
            title: "Files still uploading",
            description: "Please wait for all files to finish uploading before submitting."
          });
          setVerifyingUploads(false);
          setSubmissionPhase('idle');
          return;
        }
        
        console.log(`[FormSubmitButton][${formId}] All uploads verified, proceeding with submission`);
        setSubmissionPhase('submitting');
      } catch (error) {
        console.error(`[FormSubmitButton][${formId}] Error verifying uploads:`, error);
        toast({
          variant: "destructive",
          title: "Upload Verification Error",
          description: "There was a problem verifying your uploads. Please try again."
        });
        setVerifyingUploads(false);
        setSubmissionPhase('idle');
        return;
      } finally {
        setVerifyingUploads(false);
      }
    }
    
    // Continue with the provided click handler
    if (onSubmitClick) {
      try {
        console.log(`[FormSubmitButton][${formId}] Calling onSubmitClick handler`);
        await onSubmitClick();
      } catch (error) {
        console.error(`[FormSubmitButton][${formId}] Error in click handler:`, error);
        toast({
          variant: "destructive",
          title: "Submission Error",
          description: "There was a problem processing your request. Please try again."
        });
        setSubmissionPhase('idle');
      }
    }
  }, [isSubmitting, verifyingUploads, props.disabled, onSubmitClick, formId, clickAttempts, lastClickTime, onVerifyUploads, submissionPhase]);
  
  // Determine loading text based on submission phase
  const getStatusText = () => {
    switch(submissionPhase) {
      case 'verifying': 
        return "Verifying uploads...";
      case 'uploading': 
        return "Finalizing uploads...";
      case 'submitting': 
        return loadingText;
      default: 
        return loadingText;
    }
  };
  
  const isProcessing = isSubmitting || verifyingUploads;
  
  return (
    <Button
      type="submit"
      className={`relative ${className}`}
      disabled={isProcessing || props.disabled}
      aria-busy={isProcessing}
      onClick={handleClick}
      data-testid="form-submit-button"
      aria-label={isProcessing ? getStatusText() : (children?.toString() || "Submit")}
      {...props}
    >
      {isProcessing ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {getStatusText()}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {children}
        </span>
      )}
    </Button>
  );
};
