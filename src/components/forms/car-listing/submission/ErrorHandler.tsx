
/**
 * Changes made:
 * - 2024-06-07: Created ErrorHandler component to display form submission errors
 * - 2024-08-20: Enhanced error display and action handling
 * - 2024-08-15: Updated to use consistent recovery paths and UI patterns
 * - 2026-05-10: Added network detection and improved offline handling
 * - 2025-04-05: Fixed TypeScript type issues
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppError } from "@/errors/classes";
import { RecoveryType } from "@/errors/types";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

interface ErrorHandlerProps {
  error: string | AppError;
  description?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  actionLabel?: string;
  actionFn?: () => void;
}

export const ErrorHandler = ({ 
  error,
  description,
  onRetry,
  onDismiss,
  actionLabel,
  actionFn
}: ErrorHandlerProps) => {
  const navigate = useNavigate();
  const { isOffline } = useOfflineStatus();

  // Normalize error object to extract messages and actions
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof AppError 
      ? error.message 
      : 'An error occurred';
  
  const errorDescription = typeof error === 'string'
    ? description
    : error instanceof AppError
      ? error.description || description
      : description;

  const handleRecoveryAction = () => {
    if (typeof error !== 'string' && error instanceof AppError && error.recovery?.handler) {
      error.recovery.handler();
      return;
    }
    
    if (actionFn) {
      actionFn();
      return;
    }
    
    if (onRetry) {
      onRetry();
      return;
    }
    
    handleDefaultAction();
  };
  
  const recoveryLabel = actionLabel || 
    (typeof error !== 'string' && error instanceof AppError && error.recovery?.label) || 
    (onRetry ? "Try again" : "Resolve");

  // Enhanced default action with intelligence about error type
  const handleDefaultAction = () => {
    // If we're offline, offer to reload the page
    if (isOffline) {
      toast.warning("You appear to be offline", {
        description: "Please check your connection before continuing.",
        action: {
          label: "Reload Page",
          onClick: () => window.location.reload()
        }
      });
      return;
    }
    
    // Intelligent fallback actions based on error content
    if (typeof error === 'string') {
      if (error.toLowerCase().includes('valuation')) {
        toast.error("Missing vehicle information", {
          description: "Please complete the vehicle valuation first.",
          action: {
            label: "Start Valuation",
            onClick: () => navigate('/sellers')
          }
        });
        navigate('/sellers');
      } else if (error.toLowerCase().includes('session') || 
                error.toLowerCase().includes('sign in') || 
                error.toLowerCase().includes('authenticate')) {
        toast.error("Session expired", {
          description: "Please sign in again to continue.",
          action: {
            label: "Sign In",
            onClick: () => navigate('/auth')
          }
        });
      } else if (error.toLowerCase().includes('network') || 
                error.toLowerCase().includes('connection') || 
                error.toLowerCase().includes('timeout')) {
        toast.error("Network issue detected", {
          description: "Please check your connection and try again.",
          action: {
            label: "Refresh Page",
            onClick: () => window.location.reload()
          }
        });
      } else {
        // Generic fallback
        toast.error("Failed to submit listing", {
          description: "Please check your connection and try again. If the problem persists, contact support.",
          action: {
            label: "Contact Support",
            onClick: () => window.location.href = 'mailto:support@autostrada.com'
          }
        });
      }
    } else if (error instanceof AppError) {
      // Handle based on error category if available
      if (error.category === 'authentication') {
        navigate('/auth');
      } else if (error.category === 'validation') {
        // Validation errors should scroll to top for form review
        window.scrollTo(0, 0);
      } else if (error.category === 'network') {
        window.location.reload();
      }
    }
  };

  // For offline state, show a specialized error
  if (isOffline) {
    return (
      <Alert variant="destructive" className="mb-6">
        <WifiOff className="h-4 w-4" />
        <div className="flex flex-col space-y-2">
          <AlertTitle>You are currently offline</AlertTitle>
          <AlertDescription>Please check your internet connection and try again.</AlertDescription>
          <div className="flex space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
              className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
            >
              Reload Page
            </Button>
            
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>{errorMessage}</AlertTitle>
        {errorDescription && <AlertDescription>{errorDescription}</AlertDescription>}
        <div className="flex space-x-2 mt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRecoveryAction}
            className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
          >
            {recoveryLabel}
          </Button>
          
          {actionLabel && onRetry && actionFn !== onRetry && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRetry}
            >
              Try again
            </Button>
          )}
          
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
