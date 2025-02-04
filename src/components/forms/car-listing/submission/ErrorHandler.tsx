import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const ErrorHandler = ({ 
  error,
  onRetry 
}: { 
  error: string;
  onRetry?: () => void;
}) => {
  const navigate = useNavigate();

  const handleError = () => {
    if (error.includes('valuation')) {
      toast.error("Missing vehicle information", {
        description: "Please complete the vehicle valuation first.",
        action: {
          label: "Start Valuation",
          onClick: () => navigate('/sellers')
        }
      });
      navigate('/sellers');
    } else if (error.includes('session')) {
      toast.error("Session expired", {
        description: "Please sign in again to continue.",
        action: {
          label: "Sign In",
          onClick: () => navigate('/auth')
        }
      });
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
      <AlertDescription>
        {error}
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
};