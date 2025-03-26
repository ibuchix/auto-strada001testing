
/**
 * Changes made:
 * - 2024-06-07: Created FormTransactionError component to display form submission errors
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormTransactionErrorProps {
  error: string;
  onRetry?: () => void;
}

export const FormTransactionError = ({ 
  error, 
  onRetry 
}: FormTransactionErrorProps) => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        
        {onRetry && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
};
