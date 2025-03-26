
/**
 * Component to show seller verification progress
 */

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationProgressProps {
  onRetry?: () => void;
}

export const VerificationProgress = ({ onRetry }: VerificationProgressProps) => {
  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        
        <h2 className="text-xl font-bold text-center mb-4">Verifying Your Account</h2>
        
        <p className="text-center text-subtitle mb-6">
          We're currently verifying your seller profile. This usually takes just a moment.
        </p>
        
        <div className="space-y-4">
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full animate-pulse w-2/3"></div>
          </div>
          
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Verification
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
