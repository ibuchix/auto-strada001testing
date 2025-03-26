
/**
 * Changes made:
 * - 2024-07-30: Added force enable option and improved state handling
 * - 2024-08-05: Enhanced error handling and re-enabled submission after timeout
 * - 2025-07-21: Added better error recovery for blank screen issues
 * - 2025-07-22: Improved error handling for 400/404 errors and added better diagnostics
 * - 2027-07-30: Enhanced button loading states and added recovery mechanisms
 * - 2027-08-12: Improved error states and added recovery options
 */

import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";
import { TransactionStatusIndicator } from "@/components/transaction/TransactionStatusIndicator";
import { TransactionStateIndicator } from "@/components/transaction/TransactionStateIndicator";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { useState, useEffect } from "react";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
  isSuccess?: boolean;
  transactionStatus?: TransactionStatus | null;
  forceEnable?: boolean;
  onRetry?: () => void;
  diagnosticId?: string;
  formData?: any;
}

export const FormSubmitButton = ({ 
  isSubmitting, 
  isSuccess, 
  transactionStatus,
  forceEnable = false,
  onRetry,
  diagnosticId,
  formData
}: FormSubmitButtonProps) => {
  // Track how long the button has been in a pending state
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [buttonEnabled, setButtonEnabled] = useState<boolean>(true);
  const [errorOccurred, setErrorOccurred] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  
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
  
  // Add diagnostic logging when transaction status changes
  useEffect(() => {
    if (diagnosticId && transactionStatus) {
      logDiagnostic('SUBMIT_BUTTON', `Transaction status changed to ${transactionStatus}`, {
        pendingDuration,
        errorOccurred,
        errorDetails
      }, diagnosticId);
    }
  }, [transactionStatus, diagnosticId, pendingDuration, errorOccurred, errorDetails]);
  
  // Reset error details when transaction status changes to avoid stale errors
  useEffect(() => {
    if (transactionStatus === TransactionStatus.PENDING) {
      setErrorDetails('');
    } else if (transactionStatus === TransactionStatus.ERROR) {
      setErrorOccurred(true);
      setErrorDetails('Submission failed. Please try again.');
    }
  }, [transactionStatus]);

  // Try to recover form data from localStorage when an error occurs
  useEffect(() => {
    if (hasError && !recoveryAttempted) {
      const hasLocalData = localStorage.getItem('formBackupKeys') !== null;
      
      if (hasLocalData) {
        setRecoveryAttempted(true);
        
        // Don't immediately show recovery dialog if we have a retry handler
        if (!onRetry) {
          setShowRecoveryDialog(true);
        }
      }
      
      if (diagnosticId) {
        logDiagnostic('RECOVERY_CHECK', 'Checking for recoverable data', { 
          hasLocalData, 
          showDialog: !onRetry && hasLocalData 
        }, diagnosticId);
      }
    }
  }, [hasError, onRetry, recoveryAttempted, diagnosticId]);
  
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
            setErrorDetails('Submission timeout: The request took too long to complete');
            if (diagnosticId) {
              logDiagnostic('SUBMIT_TIMEOUT', 'Submission timed out after 10 seconds', null, diagnosticId);
            }
            clearInterval(interval);
          }
          return newDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPending, diagnosticId]);
  
  // Allow forcing button to be enabled
  const isDisabled = !forceEnable && isPending && pendingDuration <= 10 && !buttonEnabled;
  
  // Show warning if button was force-enabled
  const showTimeoutWarning = isPending && pendingDuration > 10;
  
  // Recovery function if the app seems stuck
  const recoverFromStuckState = () => {
    console.log('Attempting to recover from stuck state');
    if (diagnosticId) {
      logDiagnostic('RECOVERY_ATTEMPT', 'User-initiated recovery from stuck submission', {
        transactionStatus,
        pendingDuration
      }, diagnosticId);
    }
    
    setErrorOccurred(true);
    setButtonEnabled(true);
    setPendingDuration(0);
    
    // Log diagnostic information
    console.log('Diagnostic info:');
    console.log('- Transaction status:', transactionStatus);
    console.log('- Pending duration:', pendingDuration);
    console.log('- LocalStorage contents:', Object.keys(localStorage));
    
    // Call the onRetry handler if provided
    if (onRetry) {
      onRetry();
    }
    
    // Force window refresh if things seem truly stuck
    if (transactionStatus === TransactionStatus.PENDING && pendingDuration > 20) {
      // Log that we're forcing a reload due to stuck state
      console.log('Forcing navigation to dashboard due to stuck state');
      
      // Save form data to localStorage before navigating away
      if (formData) {
        try {
          const timestamp = new Date().toISOString();
          localStorage.setItem(`emergencyBackup_${timestamp}`, JSON.stringify(formData));
          localStorage.setItem('lastEmergencyBackup', timestamp);
          
          if (diagnosticId) {
            logDiagnostic('EMERGENCY_BACKUP', 'Created emergency backup before navigation', {
              timestamp,
              backupCreated: true
            }, diagnosticId);
          }
        } catch (error) {
          console.error('Failed to create emergency backup:', error);
        }
      }
      
      window.location.href = '/dashboard/seller';
    }
  };
  
  // Handle recovery action from dialog
  const handleRecoveryAction = () => {
    setShowRecoveryDialog(false);
    
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
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
          
          if (diagnosticId) {
            logDiagnostic('SUBMIT_CLICKED', 'Submit button clicked', {
              isDisabled,
              transactionStatus,
              pendingDuration
            }, diagnosticId);
          }
          
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
            <AlertTriangle className="h-5 w-5" />
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
          There was an error with your submission. {errorDetails ? errorDetails : "Please try again."}
        </div>
      )}
      
      {transactionStatus && (
        <div className="mt-2 flex justify-center">
          <TransactionStateIndicator 
            status={transactionStatus} 
            pendingText="Processing submission..." 
            successText="Submission successful!"
            errorText="Submission failed"
            onRetry={onRetry}
          />
        </div>
      )}
      
      {pendingDuration > 15 && (
        <div className="mt-2 flex justify-center gap-2">
          <Button 
            variant="outline" 
            className="mt-2 text-sm"
            onClick={() => {
              window.location.href = '/dashboard/seller';
            }}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            className="mt-2 text-sm"
            onClick={recoverFromStuckState}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Form
          </Button>
        </div>
      )}
      
      {/* Recovery Dialog */}
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-500" />
              Recover Your Progress
            </AlertDialogTitle>
            <AlertDialogDescription>
              It looks like your previous submission was interrupted. Would you like to try recovering your form data and continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecoveryAction}>
              Recover My Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
