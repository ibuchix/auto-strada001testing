
/**
 * Changes made:
 * - 2024-07-30: Added force enable option and improved state handling
 * - 2024-08-05: Enhanced error handling and re-enabled submission after timeout
 * - 2025-07-21: Added better error recovery for blank screen issues
 */

import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { TransactionStatusIndicator } from "@/components/transaction/TransactionStatusIndicator";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { useState, useEffect } from "react";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
  isSuccess?: boolean;
  transactionStatus?: TransactionStatus | null;
  forceEnable?: boolean;
}

export const FormSubmitButton = ({ 
  isSubmitting, 
  isSuccess, 
  transactionStatus,
  forceEnable = false
}: FormSubmitButtonProps) => {
  // Track how long the button has been in a pending state
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [buttonEnabled, setButtonEnabled] = useState<boolean>(true);
  const [errorOccurred, setErrorOccurred] = useState<boolean>(false);
  
  // Determine the button state based on transaction status or legacy props
  const isPending = transactionStatus === TransactionStatus.PENDING || isSubmitting;
  const isCompleted = transactionStatus === TransactionStatus.SUCCESS || isSuccess;
  const hasError = transactionStatus === TransactionStatus.ERROR || errorOccurred;

  // Reset pending duration when not pending
  useEffect(() => {
    if (!isPending) {
      setPendingDuration(0);
      setButtonEnabled(true);
    }
  }, [isPending]);
  
  // Track pending duration and force enable after timeout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPending) {
      interval = setInterval(() => {
        setPendingDuration(prev => {
          const newDuration = prev + 1;
          // After 10 seconds in pending state, force enable the button
          if (newDuration > 10) {
            setButtonEnabled(true);
            setErrorOccurred(true);
            clearInterval(interval);
          }
          return newDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPending]);
  
  // Allow forcing button to be enabled
  const isDisabled = !forceEnable && isPending && pendingDuration <= 10 && !buttonEnabled;
  
  // Show warning if button was force-enabled
  const showTimeoutWarning = isPending && pendingDuration > 10;
  
  // Recovery function if the app seems stuck
  const recoverFromStuckState = () => {
    console.log('Attempting to recover from stuck state');
    setErrorOccurred(true);
    setButtonEnabled(true);
    setPendingDuration(0);
    
    // Force window refresh if things seem truly stuck
    if (transactionStatus === TransactionStatus.PENDING && pendingDuration > 20) {
      window.location.href = '/dashboard/seller';
    }
  };
  
  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 shadow-lg rounded-t-lg border-t z-50">
      <Button
        type="submit"
        className={`w-full ${isCompleted ? 'bg-[#21CA6F]' : hasError ? 'bg-amber-600' : 'bg-[#DC143C]'} hover:${isCompleted ? 'bg-[#21CA6F]/90' : hasError ? 'bg-amber-700' : 'bg-[#DC143C]/90'} text-white font-semibold py-4 text-lg rounded-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
        disabled={isDisabled}
        onClick={() => {
          // Log when button is clicked
          console.log('Submit button clicked, disabled state:', isDisabled);
          console.log('Current transaction status:', transactionStatus);
          
          // If the button has been pending for too long, try to recover
          if (pendingDuration > 15) {
            recoverFromStuckState();
          }
        }}
      >
        {isPending ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Submitting your listing...</span>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Listing Submitted Successfully</span>
          </div>
        ) : hasError ? (
          <span className="flex items-center justify-center gap-2">
            Try Submitting Again
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Submit Listing
          </span>
        )}
      </Button>
      
      {showTimeoutWarning && (
        <div className="mt-2 text-amber-500 text-sm text-center">
          Submission is taking longer than expected. You can try again or check your dashboard to see if your listing was created.
        </div>
      )}
      
      {hasError && (
        <div className="mt-2 text-amber-500 text-sm text-center">
          There was an error with your submission. Please try again.
        </div>
      )}
      
      {transactionStatus && (
        <div className="mt-2 flex justify-center">
          <TransactionStatusIndicator 
            status={transactionStatus} 
            pendingText="Processing submission..." 
            successText="Submission successful!"
            errorText="Submission failed"
          />
        </div>
      )}
      
      {pendingDuration > 15 && (
        <div className="mt-2 flex justify-center">
          <Button 
            variant="outline" 
            className="mt-2 text-sm"
            onClick={() => {
              window.location.href = '/dashboard/seller';
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
};
