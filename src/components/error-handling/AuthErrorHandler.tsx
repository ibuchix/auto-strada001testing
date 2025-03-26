
/**
 * Changes made:
 * - 2024-08-25: Created dedicated component for handling authentication errors
 * - 2024-11-16: Enhanced to handle RLS permission issues
 * - 2025-08-17: Added session storage tracking for RLS errors
 */

import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface AuthErrorHandlerProps {
  error?: string | null;
  onRetry?: () => void;
  showSignIn?: boolean;
  isRlsError?: boolean;
}

/**
 * Specialized component for handling authentication-related errors
 */
export const AuthErrorHandler = ({ 
  error, 
  onRetry,
  showSignIn = true,
  isRlsError = false
}: AuthErrorHandlerProps) => {
  const navigate = useNavigate();
  
  // Track RLS errors in session storage for diagnostics
  useEffect(() => {
    if (isRlsError && error) {
      sessionStorage.setItem('rls_error_detected', 'true');
      sessionStorage.setItem('rls_error_message', error);
      sessionStorage.setItem('rls_error_time', new Date().toISOString());
    }
  }, [isRlsError, error]);

  if (!error) return null;

  const errorTitle = isRlsError ? "Permission Error" : "Authentication Error";
  const errorDescription = isRlsError
    ? "You don't have permission to access this resource. This may be due to Row Level Security policies."
    : error;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{errorDescription}</AlertDescription>
        <div className="flex space-x-2 mt-2">
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
          
          {isRlsError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/seller-registration-repair')}
              className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
            >
              Repair Registration
            </Button>
          )}
          
          {showSignIn && (
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
