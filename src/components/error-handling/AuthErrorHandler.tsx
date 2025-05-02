
/**
 * Changes made:
 * - 2024-08-25: Created dedicated component for handling authentication errors
 * - 2024-11-16: Enhanced to handle RLS permission issues
 * - 2024-08-15: Updated with consistent recovery paths and UI patterns
 * - 2025-04-05: Fixed TypeScript type issues
 * - 2025-06-16: Fixed import and removed AuthenticationError
 */

import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { AppError } from "@/errors/classes";

interface AuthErrorHandlerProps {
  error?: string | AppError | null;
  onRetry?: () => void;
  showSignIn?: boolean;
  isRlsError?: boolean;
  customAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Specialized component for handling authentication-related errors
 * with consistent recovery options
 */
export const AuthErrorHandler = ({ 
  error, 
  onRetry,
  showSignIn = true,
  isRlsError = false,
  customAction
}: AuthErrorHandlerProps) => {
  const navigate = useNavigate();

  if (!error) return null;

  // Extract error details
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof AppError 
      ? error.message 
      : 'Authentication error';
  
  const errorDescription = typeof error !== 'string' && error instanceof AppError
    ? error.description
    : isRlsError
      ? "You don't have permission to access this resource. This may be due to Row Level Security policies."
      : undefined;

  // Use recovery action from error if available
  const recoveryAction = customAction || (
    typeof error !== 'string' && error instanceof AppError && error.recovery
      ? {
          label: error.recovery.label,
          onClick: () => {
            if (error.recovery?.handler) {
              error.recovery.handler();
            }
          }
        }
      : undefined
  );

  const errorTitle = isRlsError ? "Permission Error" : "Authentication Error";

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{errorDescription || errorMessage}</AlertDescription>
        <div className="flex space-x-2 mt-2">
          {recoveryAction && (
            <Button 
              variant="default"
              size="sm"
              onClick={recoveryAction.onClick}
              className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
            >
              {recoveryAction.label}
            </Button>
          )}
          
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
            >
              Try Again
            </Button>
          )}
          
          {showSignIn && !recoveryAction && (
            <Button 
              variant="default"
              size="sm"
              onClick={() => navigate('/auth')}
              className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
