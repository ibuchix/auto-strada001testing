
/**
 * Changes made:
 * - 2024-06-07: Created ErrorHandler component to display form submission errors
 * - 2024-08-20: Enhanced error display and action handling
 * - 2024-08-15: Updated to use consistent recovery paths and UI patterns
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BaseApplicationError } from "@/errors/classes";
import { RecoveryType } from "@/errors/types";

interface ErrorHandlerProps {
  error: string | BaseApplicationError;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  actionFn?: () => void;
}

export const ErrorHandler = ({ 
  error,
  description,
  onRetry,
  actionLabel,
  actionFn
}: ErrorHandlerProps) => {
  const navigate = useNavigate();

  // Normalize error object to extract messages and actions
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof BaseApplicationError 
      ? error.message 
      : 'An error occurred';
  
  const errorDescription = typeof error === 'string'
    ? description
    : error instanceof BaseApplicationError
      ? error.description || description
      : description;

  const recoveryAction = actionFn || 
    (error instanceof BaseApplicationError && error.recovery?.action) || 
    onRetry;
    
  const recoveryLabel = actionLabel || 
    (error instanceof BaseApplicationError && error.recovery?.label) || 
    (onRetry ? "Try again" : "Resolve");

  // Enhanced default action with intelligence about error type
  const handleDefaultAction = () => {
    if (recoveryAction) {
      recoveryAction();
      return;
    }
    
    // Intelligent fallback actions based on error content
    if (typeof error === 'string') {
      if (error.includes('valuation')) {
        toast.error("Missing vehicle information", {
          description: "Please complete the vehicle valuation first.",
          action: {
            label: "Start Valuation",
            onClick: () => navigate('/sellers')
          }
        });
        navigate('/sellers');
      } else if (error.includes('session') || error.includes('sign in') || error.includes('authenticate')) {
        toast.error("Session expired", {
          description: "Please sign in again to continue.",
          action: {
            label: "Sign In",
            onClick: () => navigate('/auth')
          }
        });
      } else {
        // Generic fallback
        toast.error("Failed to submit listing", {
          description: "Please check your connection and try again. If the problem persists, contact support.",
          action: {
            label: "Contact Support",
            onClick: () => window.location.href = 'mailto:support@example.com'
          }
        });
      }
    } else if (error instanceof BaseApplicationError) {
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
            onClick={handleDefaultAction}
            className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
          >
            {recoveryLabel}
          </Button>
          
          {actionLabel && onRetry && recoveryAction !== onRetry && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRetry}
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
