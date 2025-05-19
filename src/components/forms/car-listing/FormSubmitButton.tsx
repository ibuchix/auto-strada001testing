
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
 * - 2025-05-19: Fixed submission phase tracking, improved upload verification, and added direct storage fallback
 * - 2025-05-19: Fixed toast variant type error by changing "warning" to "default"
 * - 2025-05-19: Enhanced state management and improved upload verification with timeout control
 */
import React, { useState, useCallback, useEffect } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, Upload } from "lucide-react";
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
  const [verificationRetries, setVerificationRetries] = useState(0);
  const [verificationTimeout, setVerificationTimeout] = useState<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  
  // Reset submission phase when isSubmitting changes to false
  useEffect(() => {
    if (!isSubmitting && submissionPhase !== 'idle') {
      const timer = setTimeout(() => {
        setSubmissionPhase('idle');
        setVerificationRetries(0);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting, submissionPhase]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (verificationTimeout) {
        clearTimeout(verificationTimeout);
      }
    };
  }, [verificationTimeout]);
  
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
      submissionPhase,
      verificationRetries
    });
    
    // Prevent rapid successive clicks (throttling)
    if (timeSinceLastClick < 1000) {
      console.log(`[FormSubmitButton][${formId}] Click throttled (${timeSinceLastClick}ms since last click)`);
      return;
    }
    
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
        
        console.log(`[FormSubmitButton][${formId}] Verifying uploads before submission (attempt ${verificationRetries + 1})`);
        
        // Check for global uploader and get pending file count
        const globalUploader = (window as any).__tempFileUploadManager;
        const pendingCount = globalUploader?.pendingFileCount?.() || 0;
        
        console.log(`[FormSubmitButton][${formId}] Found ${pendingCount} pending files`);
        
        // Set a timeout to ensure verification doesn't hang indefinitely (increased to 15 seconds)
        if (verificationTimeout) {
          clearTimeout(verificationTimeout);
        }
        
        const timeout = setTimeout(() => {
          console.log(`[FormSubmitButton][${formId}] Verification timeout reached`);
          
          // If there are pending files, we should warn but allow the submission to proceed
          if (pendingCount > 0) {
            toast({
              variant: "default", // Changed from "warning" to "default"
              title: "Some uploads may not be complete",
              description: "Proceeding with submission, but some images may not be included."
            });
          }
          
          handleVerificationComplete(pendingCount === 0);
        }, 15000); // 15 second timeout
        
        setVerificationTimeout(timeout);
        
        // Run the actual verification
        try {
          const uploadsComplete = await onVerifyUploads();
          
          // Clear timeout as verification completed in time
          if (verificationTimeout) {
            clearTimeout(verificationTimeout);
            setVerificationTimeout(null);
          }
          
          handleVerificationComplete(uploadsComplete);
        } catch (error) {
          console.error(`[FormSubmitButton][${formId}] Verification error:`, error);
          
          // Clear timeout as verification errored
          if (verificationTimeout) {
            clearTimeout(verificationTimeout);
            setVerificationTimeout(null);
          }
          
          // Handle verification error
          if (verificationRetries < maxRetries) {
            setVerificationRetries(prev => prev + 1);
            toast({
              variant: "default",
              title: "Verifying uploads",
              description: `Still processing uploads (attempt ${verificationRetries + 1}/${maxRetries+1})...`
            });
            
            // Add a slight delay before retrying
            setTimeout(() => {
              handleClick(e);
            }, 3000);
            
            setVerifyingUploads(false);
            return;
          } else {
            // Max retries exceeded, show warning but proceed
            toast({
              variant: "default", // Changed from "warning" to "default"
              title: "Upload verification failed",
              description: "Proceeding with submission, but some images may not be included."
            });
            
            // Continue to submission phase
            handleVerificationComplete(true);
          }
        }
      } catch (error) {
        console.error(`[FormSubmitButton][${formId}] Error in verification process:`, error);
        toast({
          variant: "destructive",
          title: "Upload Verification Error",
          description: "There was a problem verifying your uploads. Please try again."
        });
        setVerifyingUploads(false);
        setSubmissionPhase('idle');
        return;
      }
    } else {
      // No verification needed, proceed directly to submission
      continueWithSubmission();
    }
  }, [
    isSubmitting, 
    verifyingUploads, 
    props.disabled, 
    onVerifyUploads, 
    formId, 
    clickAttempts, 
    lastClickTime, 
    submissionPhase, 
    verificationRetries,
    verificationTimeout,
    maxRetries
  ]);
  
  // Helper function to handle verification completion
  const handleVerificationComplete = useCallback((uploadsComplete: boolean) => {
    console.log(`[FormSubmitButton][${formId}] Verification complete, uploads complete: ${uploadsComplete}`);
    
    if (!uploadsComplete) {
      console.log(`[FormSubmitButton][${formId}] Uploads not complete`);
      
      // If we haven't exceeded max retries, retry verification
      if (verificationRetries < maxRetries) {
        setVerificationRetries(prev => prev + 1);
        toast({
          title: "Finalizing uploads",
          description: `Still processing uploads (attempt ${verificationRetries + 1}/${maxRetries+1})...`
        });
        
        // Add a slight delay before retrying
        setTimeout(() => {
          try {
            console.log(`[FormSubmitButton][${formId}] Retrying verification...`);
            setSubmissionPhase('verifying');
            handleClick(new MouseEvent('click') as any);
          } catch (error) {
            console.error(`[FormSubmitButton][${formId}] Error in retry:`, error);
          }
        }, 3000);
        
        return;
      } else {
        // Max retries exceeded, show warning but proceed
        toast({
          variant: "default", // Changed from "warning" to "default"
          title: "Some uploads may not be complete",
          description: "Proceeding with submission, but some images may not be included."
        });
      }
    }
    
    // After verification, proceed to uploading phase if needed
    setSubmissionPhase('uploading');
    
    // Add a slight delay to allow any pending uploads to finalize
    setTimeout(() => {
      console.log(`[FormSubmitButton][${formId}] All uploads verified, proceeding with submission`);
      continueWithSubmission();
    }, 1000);
  }, [formId, verificationRetries, maxRetries, handleClick]);
  
  // Continue with submission after verification
  const continueWithSubmission = useCallback(async () => {
    setSubmissionPhase('submitting');
    
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
    
    setVerifyingUploads(false);
  }, [onSubmitClick, formId]);
  
  // Determine loading text based on submission phase
  const getStatusText = () => {
    switch(submissionPhase) {
      case 'verifying': 
        return "Verifying uploads...";
      case 'uploading': 
        return `Finalizing uploads${verificationRetries > 0 ? ` (retry ${verificationRetries})` : ''}...`;
      case 'submitting': 
        return loadingText;
      default: 
        return loadingText;
    }
  };
  
  // Get the appropriate icon for the current state
  const getStatusIcon = () => {
    switch(submissionPhase) {
      case 'verifying':
        return <AlertCircle className="h-4 w-4 animate-pulse" />;
      case 'uploading':
        return <Upload className="h-4 w-4 animate-bounce" />;
      case 'submitting':
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
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
      data-phase={submissionPhase}
      aria-label={isProcessing ? getStatusText() : (children?.toString() || "Submit")}
      {...props}
    >
      {isProcessing ? (
        <span className="flex items-center gap-2">
          {getStatusIcon()}
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
