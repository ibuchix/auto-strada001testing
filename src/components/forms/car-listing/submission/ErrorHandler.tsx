
/**
 * Changes made:
 * - 2024-06-07: Created ErrorHandler component to display form submission errors
 * - 2024-08-20: Enhanced error display and action handling
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ErrorHandlerProps {
  error: string;
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

  const handleDefaultAction = () => {
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
    } else if (actionFn) {
      actionFn();
    } else if (onRetry) {
      onRetry();
    } else {
      toast.error("Failed to submit listing", {
        description: "Please check your connection and try again. If the problem persists, contact support.",
        action: {
          label: "Contact Support",
          onClick: () => window.location.href = 'mailto:support@example.com'
        }
      });
    }
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>{error}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
        <div className="flex space-x-2 mt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDefaultAction}
            className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
          >
            {actionLabel || (onRetry ? "Try again" : "Resolve")}
          </Button>
          
          {actionLabel && onRetry && (
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
