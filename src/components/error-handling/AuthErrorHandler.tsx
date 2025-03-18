
/**
 * Changes made:
 * - 2024-08-25: Created dedicated component for handling authentication errors
 */

import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface AuthErrorHandlerProps {
  error?: string | null;
  onRetry?: () => void;
  showSignIn?: boolean;
}

/**
 * Specialized component for handling authentication-related errors
 */
export const AuthErrorHandler = ({ 
  error, 
  onRetry,
  showSignIn = true
}: AuthErrorHandlerProps) => {
  const navigate = useNavigate();

  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
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
